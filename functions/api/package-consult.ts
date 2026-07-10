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

const CHANNEL_API = 'https://api.channel.io/open/v5';

async function channelRequest(
  env: Env,
  path: string,
  method: string,
  body?: unknown,
): Promise<Record<string, unknown>> {
  const res = await fetch(`${CHANNEL_API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-access-key': env.CHANNEL_ACCESS_KEY,
      'x-access-secret': env.CHANNEL_ACCESS_SECRET,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Channel API ${method} ${path}: ${res.status} ${text}`);
  }
  return res.json() as Promise<Record<string, unknown>>;
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

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
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

    const userRes = await channelRequest(context.env, `/users/@${encodeURIComponent(memberId)}`, 'PUT', {
      profile: {
        name: payload.name.trim(),
        mobileNumber: payload.phone.trim(),
      },
      tags: ['방문패키지상담', 'BodyCare'],
    });

    const user = userRes.user as { id?: string } | undefined;
    if (!user?.id) throw new Error('User ID not returned from Channel Talk');

    const chatRes = await channelRequest(context.env, `/users/${user.id}/user-chats`, 'POST', {});
    const userChat = chatRes.userChat as { id?: string } | undefined;
    if (!userChat?.id) throw new Error('UserChat ID not returned from Channel Talk');

    const botName = context.env.CHANNEL_BOT_NAME || 'Channel';
    const msgPath = `/user-chats/${userChat.id}/messages?botName=${encodeURIComponent(botName)}`;
    await channelRequest(context.env, msgPath, 'POST', {
      plainText: formatMessage(payload),
    });

    return jsonResponse({ ok: true });
  } catch (err) {
    console.error('[package-consult]', err);
    return jsonResponse({ error: '상담 등록에 실패했습니다. 잠시 후 다시 시도해주세요.' }, 500);
  }
};
