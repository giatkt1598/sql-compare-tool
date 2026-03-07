export async function readApiErrorMessage(
  response: Response,
  fallbackMessage: string
): Promise<string> {
  const responseText = await response.text();
  if (!responseText) {
    return fallbackMessage;
  }

  try {
    const parsed = JSON.parse(responseText) as { message?: unknown };
    if (typeof parsed.message === 'string' && parsed.message.trim() !== '') {
      return parsed.message;
    }
  } catch {
    // Response is not JSON. Fall back to raw text.
  }

  return responseText;
}
