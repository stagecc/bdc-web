export interface ContactPayload {
  name?: string;
  email: string;
}

export function buildContactPayload(
  values: Record<string, unknown>,
): ContactPayload {
  const payload: ContactPayload = {
    email: values.email as string,
  };

  if (values.name && typeof values.name === 'string' && values.name.trim()) {
    payload.name = values.name.trim();
  }

  return payload;
}
