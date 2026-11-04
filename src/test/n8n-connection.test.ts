import { describe, it, expect, vi, afterEach } from 'vitest';
import { endpointSchema, parseCases } from '@/lib/n8n-validation';
import { requestCases, cryptToken } from '@/lib/n8n.server';
import samples from '@/data/sample-cases.json';
afterEach(()=>vi.unstubAllGlobals());
describe('Secure n8n connections',()=>{
 it('rejects private hosts, plain HTTP, URL credentials, query credentials, and untrusted hosts',()=>{
  for(const url of ['http://a.app.n8n.cloud/webhook/x','https://127.0.0.1/webhook/x','https://a.app.n8n.cloud.evil.com/webhook/x','https://user:password@a.app.n8n.cloud/webhook/x','https://a.app.n8n.cloud/webhook/x?token=x']) expect(endpointSchema.safeParse(url).success).toBe(false);
  expect(endpointSchema.safeParse('https://retail.app.n8n.cloud/webhook/summary').success).toBe(true);
 });
 it('accepts workbook column naming and rejects malformed cases',()=>{
  expect(parseCases({cases:samples}) ).toHaveLength(750);
  expect(()=>parseCases({cases:[{'Case ID':'missing-fields'}]})).toThrow();
 });
 it('uses server credentials, blocks redirects, and returns validated cases',async()=>{
  const fake=vi.fn().mockResolvedValue(new Response(JSON.stringify(samples.slice(0,1)),{status:200}));vi.stubGlobal('fetch',fake);
  expect((await requestCases('https://retail.app.n8n.cloud/webhook/summary','x-api-key','test-only')).cases).toHaveLength(1);
  expect(fake.mock.calls[0]?.[1]).toMatchObject({redirect:'error',method:'GET',headers:{'x-api-key':'test-only'}});
 });
 it('encrypts credentials and prevents another user decrypting them',async()=>{
  const encrypted=await cryptToken('test-only','test-encryption-key','user-a');
  expect(encrypted).not.toContain('test-only');
  expect(await cryptToken(encrypted,'test-encryption-key','user-a',true)).toBe('test-only');
  await expect(cryptToken(encrypted,'test-encryption-key','user-b',true)).rejects.toThrow();
 });
});
