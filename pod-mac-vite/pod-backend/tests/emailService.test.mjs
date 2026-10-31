import assert from 'node:assert/strict';
import { test } from 'node:test';
process.env.RESEND_API_KEY = 're_test_placeholder';
process.env.NVIDIA_NIM_API_KEY = 'test-placeholder';
process.env.RECIPIENT_EMAIL = 'owner@example.com';
const { EmailService } = await import('../dist/services/emailService.js');

test('email SDK preserves reply-to and escaped content, and reports provider failures', async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  let status = 200;
  let response = { id: 'test-message' };
  globalThis.fetch = async (url, options) => {
    assert.equal(new URL(url).hostname, 'api.resend.com');
    requests.push(JSON.parse(options.body));
    return new Response(JSON.stringify(response), { status, headers: { 'Content-Type': 'application/json' } });
  };
  try {
    const service = new EmailService();
    const result = await service.sendContactEmail({ to: 'owner@example.com', senderEmail: 'sender@example.com', subject: 'Hello', message: '<img src="tracking"> & text' });
    assert.equal(result.messageId, 'test-message');
    assert.equal(requests[0].reply_to, 'sender@example.com');
    assert.match(requests[0].html, /&lt;img src=&quot;tracking&quot;&gt; &amp; text/);
    await service.sendAgentOutput({ subject: 'Agent', content: '<script>test</script>' });
    assert.deepEqual([requests[1].to].flat(), ['owner@example.com']);
    status = 403; response = { name: 'validation_error', message: 'Rejected' };
    assert.equal((await service.sendAgentOutput({ subject: 'Agent', content: 'Text' })).success, false);
    status = 200; response = {};
    assert.equal((await service.sendAgentOutput({ subject: 'Agent', content: 'Text' })).success, false);
  } finally { globalThis.fetch = originalFetch; }
});
