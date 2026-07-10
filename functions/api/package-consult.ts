interface Env {
  CHANNEL_ACCESS_KEY: string;
  CHANNEL_ACCESS_SECRET: string;
  CHANNEL_BOT_NAME?: string;
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
      const json = JSON.parse(text) as { message?: string; type?: string; errors?: unknown };
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

async function getOrCreateUserChat(env: Env, userId: string): Promise<string> {
  const listRes = await channelRequest(env, `/users/${userId}/user-chats?limit=25&sortOrder=desc`, 'GET');
  const chats = parseUserChats(listRes);

  const openChat = chats.find((c) => c.id && (c.state === 'opened' || c.state === 'snoozed'));
  if (openChat?.id) return openChat.id;

  try {
    const chatRes = await channelRequest(env, `/users/${userId}/user-chats`, 'POST', {});
    const created = chatRes.userChat as ChannelUserChat | undefined;
    if (created?.id) return created.id;
  } catch {
    const retryRes = await channelRequest(env, `/users/${userId}/user-chats?limit=25&sortOrder=desc`, 'GET');
    const retryChats = parseUserChats(retryRes);
    if (retryChats[0]?.id) return retryChats[0].id;
  }

  throw new Error('UserChat ID not returned from Channel Talk');
}

async function sendChatMessage(env: Env, userChatId: string, text: string): Promise<void> {
  const body = buildMessageBody(text);
  const botCandidates = [
    env.CHANNEL_BOT_NAME?.trim(),
    'Channel',
    '채널톡',
    'channelBot',
  ].filter((v, i, arr): v is string => Boolean(v) && arr.indexOf(v) === i);

  let lastError: Error | null = null;

  // 1) botName 없이 시도
  try {
    await channelRequest(env, `/user-chats/${userChatId}/messages`, 'POST', body);
    return;
  } catch (err) {
    lastError = err instanceof Error ? err : new Error(String(err));
  }

  // 2) 후보 botName으로 순차 시도
  for (const botName of botCandidates) {
    try {
      const path = `/user-chats/${userChatId}/messages?botName=${encodeURIComponent(botName)}`;
      await channelRequest(env, path, 'POST', body);
      return;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const msg = lastError.message.toLowerCase();
      if (!msg.includes('bot') && !msg.includes('404')) {
        throw lastError;
      }
    }
  }

  if (lastError) throw lastError;
}

function mapChannelError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();

  if (lower.includes('botnotfound') || (lower.includes('bot') && lower.includes('404'))) {
    return '채널톡 봇 이름이 맞지 않습니다. Cloudflare의 CHANNEL_BOT_NAME을 채널톡 데스크 봇 이름과 동일하게 설정해주세요.';
  }
  if (lower.includes('401') || lower.includes('403') || lower.includes('unauthorized')) {
    return '채널톡 API 키가 올바르지 않습니다. Access Key와 Secret을 다시 확인해주세요.';
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

    const phone = payload.phone.trim();
    const userRes = await channelRequest(
      context.env,
      `/users/@${encodeURIComponent(memberId)}`,
      'PUT',
      {
        profile: {
          name: payload.name.trim(),
          mobileNumber: phone,
        },
        tags: ['방문패키지상담', 'BodyCare'],
      },
    );

    const userId = parseUserId(userRes);
    const userChatId = await getOrCreateUserChat(context.env, userId);
    await sendChatMessage(context.env, userChatId, formatMessage(payload));

    return jsonResponse({ ok: true });
  } catch (err) {
    console.error('[package-consult]', err);
    return jsonResponse({ error: mapChannelError(err) }, 500);
  }
};
