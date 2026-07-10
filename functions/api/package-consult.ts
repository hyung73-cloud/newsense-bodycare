interface Env {
  CHANNEL_ACCESS_KEY: string;
  CHANNEL_ACCESS_SECRET: string;
  CHANNEL_BOT_NAME?: string;
  CHANNEL_KAKAO_CHANNEL_URL?: string;
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
const CONSULT_TAG = '방문패키지상담';
const DEFAULT_KAKAO_CHANNEL_URL = 'https://pf.kakao.com/_vxnCPl/chat';

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

function formatCustomerMessage(p: ConsultPayload, kakaoUrl: string): string {
  return [
    '방문 패키지 상담 신청합니다.',
    '',
    `이름: ${p.name.trim()}`,
    `연락처: ${p.phone.trim()}`,
    `방문희망일: ${p.visitDate}`,
    `방문희망시간: ${p.visitTime}`,
    `선택 패키지: ${p.packageSummary}`,
    `예상 합계: ${p.total.toLocaleString('ko-KR')}원`,
    '',
    '카카오톡으로 상담 이어가기:',
    kakaoUrl,
  ].join('\n');
}

function buildMessageBody(text: string) {
  return {
    blocks: [{ type: 'text', value: text }],
    plainText: text,
  };
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
  const res = await channelRequest(env, '/bots?limit=25', 'GET');
  const bots = (res.bots as Array<{ name?: string }> | undefined) ?? [];
  return bots.map((b) => b.name).filter((n): n is string => Boolean(n));
}

async function resolveBotName(env: Env): Promise<string> {
  const configured = env.CHANNEL_BOT_NAME?.trim();
  if (configured) return configured;

  const discovered = await listBotNames(env);
  if (discovered.length > 0) return discovered[0];

  return '뉴센스의원 BOT';
}

async function ensureOpenUserChat(env: Env, userId: string, botName: string): Promise<string> {
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

  if (chats[0]?.id) {
    await channelRequest(
      env,
      `/user-chats/${chats[0].id}/open?botName=${encodeURIComponent(botName)}`,
      'PUT',
    );
    return chats[0].id;
  }

  throw new Error('UserChat ID not returned from Channel Talk');
}

async function sendCustomerInquiry(
  env: Env,
  userChatId: string,
  botName: string,
  text: string,
  description: string,
): Promise<void> {
  await channelRequest(
    env,
    `/user-chats/${userChatId}/messages?botName=${encodeURIComponent(botName)}`,
    'POST',
    buildMessageBody(text),
  );

  try {
    await channelRequest(
      env,
      `/user-chats/${userChatId}/open?botName=${encodeURIComponent(botName)}`,
      'PUT',
    );
  } catch {
    // 이미 열린 상담방이면 무시
  }

  try {
    await channelRequest(env, `/user-chats/${userChatId}`, 'PATCH', { description });
  } catch {
    // 설명 업데이트 실패는 치명적이지 않음
  }
}

function mapChannelError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();

  if (lower.includes('botnotfound') || (lower.includes('bot') && lower.includes('404'))) {
    return '채널톡 봇 이름이 맞지 않습니다. CHANNEL_BOT_NAME을 뉴센스의원 BOT으로 설정해주세요.';
  }
  if (lower.includes('401') || lower.includes('403') || lower.includes('unauthorized')) {
    return '채널톡 API 키가 올바르지 않습니다. Access Key와 Secret을 다시 확인해주세요.';
  }
  if (lower.includes('userchat')) {
    return '채널톡 고객 상담방을 만들지 못했습니다. 잠시 후 다시 시도해주세요.';
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

    const botName = await resolveBotName(context.env);
    const kakaoUrl = context.env.CHANNEL_KAKAO_CHANNEL_URL?.trim() || DEFAULT_KAKAO_CHANNEL_URL;

    const userRes = await channelRequest(
      context.env,
      `/users/@${encodeURIComponent(memberId)}`,
      'PUT',
      {
        profile: {
          name: payload.name.trim(),
          mobileNumber: formatKrPhone(payload.phone),
          description: `BodyCare 방문상담 · ${payload.visitDate} ${payload.visitTime}`,
        },
        tags: [CONSULT_TAG, 'BodyCare'],
        unsubscribeTexting: false,
      },
    );

    const userId = parseUserId(userRes);
    const userChatId = await ensureOpenUserChat(context.env, userId, botName);
    const customerText = formatCustomerMessage(payload, kakaoUrl);
    const description = `방문패키지상담 · ${payload.name.trim()} · ${payload.phone.trim()}`;

    await sendCustomerInquiry(context.env, userChatId, botName, customerText, description);

    return jsonResponse({ ok: true });
  } catch (err) {
    console.error('[package-consult]', err);
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: mapChannelError(err), detail: message }, 500);
  }
};
