import { describe, it, expect } from 'vitest';
import { safeDeliveryError, summarizeEvents, type ConnectionEvent } from '@/lib/n8n-status';

const event = (id:string,kind:string,success:boolean,occurred_at:string):ConnectionEvent => ({id,kind,success,occurred_at,case_count:12,latency_ms:90,message:null});
describe('n8n delivery history',()=>{
 it('keeps the last successful delivery despite subsequent failures and tests',()=>{
  const history=summarizeEvents([event('d','delivery',true,'2026-11-04T10:00:00Z'),event('e','delivery',false,'2026-11-04T10:02:00Z'),event('t','test',true,'2026-11-04T10:03:00Z')]);
  expect(history.lastDelivery?.id).toBe('d');expect(history.errors.map(e=>e.id)).toEqual(['e']);expect(history.tests.map(e=>e.id)).toEqual(['t']);
 });
 it('returns at most five tests and errors in newest-first order',()=>{
  const history=summarizeEvents(Array.from({length:8},(_,i)=>event(String(i),'test',true,`2026-11-04T10:0${i}:00Z`)));
  expect(history.tests.map(e=>e.id)).toEqual(['7','6','5','4','3']);expect(history.lastDelivery).toBeNull();
 });
 it('never persists raw exception details or credential-like strings',()=>{
  expect(safeDeliveryError(new Error('secret=test-only https://private.example'))).toBe('Connection failed. Check your webhook, credentials, and response format.');
  expect(safeDeliveryError(new Error('n8n returned HTTP 401. token=test-only'))).toBe('n8n returned HTTP 401. Check webhook activation and credentials.');
 });
});