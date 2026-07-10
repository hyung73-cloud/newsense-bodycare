export interface PackageConsultPayload {
  name: string;
  phone: string;
  visitDate: string;
  visitTime: string;
  packageSummary: string;
  total: number;
}

export interface PackageConsultResult {
  userChatSent?: boolean;
  groupSent?: boolean;
}

export async function submitPackageConsult(payload: PackageConsultPayload): Promise<PackageConsultResult> {
  const res = await fetch('/api/package-consult', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    detail?: string;
    ok?: boolean;
    userChatSent?: boolean;
    groupSent?: boolean;
  };

  if (!res.ok) {
    const main = data.error || '상담 등록에 실패했습니다.';
    throw new Error(data.detail ? `${main}\n${data.detail}` : main);
  }

  return { userChatSent: data.userChatSent, groupSent: data.groupSent };
}
