interface Env {
  CHANNEL_ACCESS_KEY: string;
  CHANNEL_ACCESS_SECRET: string;
  CHANNEL_BOT_NAME?: string;
  CHANNEL_NOTIFY_GROUP_NAME?: string;
}

interface ConsultPayload {
  name: string;
  phone: string;
  visitDate: string;
  visitTime: string;
  packageSummary: string;
  total: number;
}

interface ChannelUserChat {
  id?: string;
  state?: string;
}

const CHANNEL_API = 'https://api.channel.io/open/v5';

async function channelRequest(
  env: Env,
  path: string,
  method: string,
  body?: unknown,
): Promise<Record<string, unknown>> {
  const headers: Record<string, string> = {
    'x-access-key': env.CHANNEL_ACCESS_KEY,
    'x-access-secret': env.CHANNEL_ACCESS_SECRET,
  };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${CHANNEL_API}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    let detail = text;
    try {
      const json = JSON.parse(text) as { message?: string; type?: string };
      detail = json.message || json.type || text;
    } catch {
      // keep raw text
    }
    throw new Error(`Channel API ${method} ${path}: ${res.status} ${detail}`);
  }

  if (res.status === 204) return {};
  const text = await res.text();
  if (!text) return {};
  return JSON.parse(text) as Record<string, unknown>;
}

function formatKrPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('82')) return `+${digits}`;
  if (digits.startsWith('0')) return `+82${digits.slice(1)}`;
  return `+82${digits}`;
}

function formatMessage(p: ConsultPayload): string {
  return [
    '[방문 패키지 상담 신청 · BodyCare]',
    '',
    `이름: ${p.name.trim()}`,
    `연락처: ${p.phone.trim()}`,
    `방문희망일: ${p.visitDate}`,
    `방문희망시간: ${p.visitTime}`,
    `선택 패키지: ${p.packageSummary}`,
    `예상 합계: ${p.total.toLocaleString('ko-KR')}원`,
  ].join('\n');
}

function formatStaffMessage(p: ConsultPayload): string {
  return [
    '📋 방문 패키지 상담 신청 (BodyCare)',
    '',
    `👤 ${p.name.trim()} / ${p.phone.trim()}`,
    `📅 ${p.visitDate} ${p.visitTime}`,
    `📦 ${p.packageSummary}`,
    `💰 ${p.total.toLocaleString('ko-KR')}원`,
    '',
    '※ 고객 대화 탭에서 연락처로 검색해 상담방을 확인하세요.',
  ].join('\n');
}

function buildMessageBody(text: string, personType?: 'user' | 'bot') {
  const body: Record<string, unknown> = {
    blocks: [{ type: 'text', value: text }],
    plainText: text,
  };
  if (personType) body.personType = personType;
  return body;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function parseUserId(res: Record<string, unknown>): string {
  const user = (res.user ?? res) as { id?: string };
  if (!user?.id) throw new Error('User ID not returned from Channel Talk');
  return user.id;
}

function parseUserChats(res: Record<string, unknown>): ChannelUserChat[] {
  return (res.userChats as ChannelUserChat[] | undefined) ?? [];
}

async function listBotNames(env: Env): Promise<string[]> {
  try {
    const res = await channelRequest(env, '/bots?limit=25', 'GET');
    const bots = (res.bots as Array<{ name?: string }> | undefined) ?? [];
    return bots.map((b) => b.name).filter((n): n is string => Boolean(n));
  } catch {
    return [];
  }
}

async function listGroupNames(env: Env): Promise<string[]> {
  try {
    const res = await channelRequest(env, '/groups?limit=50', 'GET');
    const groups = (res.groups as Array<{ name?: string }> | undefined) ?? [];
    return groups.map((g) => g.name).filter((n): n is string => Boolean(n));
  } catch {
    return [];
  }
}

function pickNotifyGroup(groups: string[], preferred?: string): string | null {
  if (preferred) {
    const exact = groups.find((g) => g === preferred);
    if (exact) return exact;
  }
  const keyword = groups.find((g) => g.includes('상담') || g.includes('뉴센스') || g.includes('BodyCare'));
  if (keyword) return keyword;
  return groups[0] ?? null;
}

async function createConsultUserChat(env: Env, userId: string): Promise<string> {
  try {
    const chatRes = await channelRequest(env, `/users/${userId}/user-chats`, 'POST');
    const created = chatRes.userChat as ChannelUserChat | undefined;
    if (created?.id) return created.id;
  } catch {
    // 이미 열린 상담방이 있을 수 있음
  }

  const listRes = await channelRequest(env, `/users/${userId}/user-chats?limit=25&sortOrder=desc`, 'GET');
  const chats = parseUserChats(listRes);
  const openChat = chats.find((c) => c.id && (c.state === 'opened' || c.state === 'snoozed'));
  if (openChat?.id) return openChat.id;
  if (chats[0]?.id) return chats[0].id;

  throw new Error('UserChat ID not returned from Channel Talk');
}

async function postMessage(
  env: Env,
  path: string,
  body: Record<string, unknown>,
  botNames: string[],
): Promise<void> {
  let lastError: Error | null = null;

  try {
    await channelRequest(env, path, 'POST', body);
    return;
  } catch (err) {
    lastError = err instanceof Error ? err : new Error(String(err));
  }

  for (const botName of botNames) {
    try {
      const separator = path.includes('?') ? '&' : '?';
      await channelRequest(env, `${path}${separator}botName=${encodeURIComponent(botName)}`, 'POST', body);
      return;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  if (lastError) throw lastError;
}

async function sendUserChatInquiry(env: Env, userChatId: string, text: string): Promise<void> {
  const botNames = await listBotNames(env);
  const candidates = [
    ...botNames,
    env.CHANNEL_BOT_NAME?.trim(),
    '뉴센스의원 BOT',
    '채널톡',
    'Channel',
    'channelBot',
  ].filter((v, i, arr): v is string => Boolean(v) && arr.indexOf(v) === i);

  // 고객 문의처럼 보이도록 user 타입 우선 시도
  try {
    await postMessage(env, `/user-chats/${userChatId}/messages`, buildMessageBody(text, 'user'), candidates);
    return;
  } catch {
    // fallback
  }

  await postMessage(env, `/user-chats/${userChatId}/messages`, buildMessageBody(text, 'bot'), candidates);
}

async function sendGroupNotification(env: Env, text: string): Promise<boolean> {
  const groups = await listGroupNames(env);
  const groupName = pickNotifyGroup(groups, env.CHANNEL_NOTIFY_GROUP_NAME?.trim());
  if (!groupName) return false;

  const botNames = await listBotNames(env);
  const candidates = [
    ...botNames,
    env.CHANNEL_BOT_NAME?.trim(),
    '뉴센스의원 BOT',
    '채널톡',
    'Channel',
    'channelBot',
  ].filter((v, i, arr): v is string => Boolean(v) && arr.indexOf(v) === i);

  await postMessage(
    env,
    `/groups/@${encodeURIComponent(groupName)}/messages`,
    buildMessageBody(text, 'bot'),
    candidates,
  );
  return true;
}

function mapChannelError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();

  if (lower.includes('botnotfound') || (lower.includes('bot') && lower.includes('404'))) {
    return '채널톡 봇을 찾지 못했습니다. 채널톡 데스크 → 설정 → 봇 이름을 확인해주세요.';
  }
  if (lower.includes('401') || lower.includes('403') || lower.includes('unauthorized')) {
    return '채널톡 API 키가 올바르지 않습니다. Access Key와 Secret을 다시 확인해주세요.';
  }
  if (lower.includes('group')) {
    return '채널톡 팀 채팅으로 알림을 보내지 못했습니다. CHANNEL_NOTIFY_GROUP_NAME을 확인해주세요.';
  }
  if (lower.includes('userchat')) {
    return '채널톡 상담방을 만들지 못했습니다. 잠시 후 다시 시도해주세요.';
  }
  return '상담 등록에 실패했습니다. 잠시 후 다시 시도해주세요.';
}

export const onRequestPost = async (context: { request: Request; env: Env }): Promise<Response> => {
  try {
    const payload = (await context.request.json()) as ConsultPayload;

    if (!payload.name?.trim() || !payload.phone?.trim() || !payload.visitDate || !payload.visitTime) {
      return jsonResponse({ error: '필수 항목을 모두 입력해주세요.' }, 400);
    }

    const memberId = payload.phone.replace(/\D/g, '');
    if (memberId.length < 10) {
      return jsonResponse({ error: '올바른 연락처를 입력해주세요.' }, 400);
    }

    const { CHANNEL_ACCESS_KEY, CHANNEL_ACCESS_SECRET } = context.env;
    if (!CHANNEL_ACCESS_KEY || !CHANNEL_ACCESS_SECRET) {
      return jsonResponse({ error: '채널톡 API가 설정되지 않았습니다. 관리자에게 문의해주세요.' }, 503);
    }

    const userRes = await channelRequest(
      context.env,
      `/users/@${encodeURIComponent(memberId)}`,
      'PUT',
      {
        profile: {
          name: payload.name.trim(),
          mobileNumber: formatKrPhone(payload.phone),
        },
        tags: ['방문패키지상담', 'BodyCare'],
      },
    );

    const userId = parseUserId(userRes);
    const userChatId = await createConsultUserChat(context.env, userId);

    const customerText = formatMessage(payload);
    const staffText = formatStaffMessage(payload);

    let userChatSent = false;
    let groupSent = false;

    try {
      await sendUserChatInquiry(context.env, userChatId, customerText);
      userChatSent = true;
    } catch (err) {
      console.error('[package-consult] userChat message failed', err);
    }

    try {
      groupSent = await sendGroupNotification(context.env, staffText);
    } catch (err) {
      console.error('[package-consult] group notification failed', err);
    }

    if (!userChatSent && !groupSent) {
      throw new Error('Both user chat and group notification failed');
    }

    return jsonResponse({ ok: true, userChatSent, groupSent });
  } catch (err) {
    console.error('[package-consult]', err);
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: mapChannelError(err), detail: message }, 500);
  }
};
