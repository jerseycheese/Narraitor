/**
 * StoreEventBus: subscribeOnce idempotency + emit error isolation.
 *
 * These guard the wiring contract that session journal entries depend on —
 * a handler registered once even under repeat module evaluation, and a
 * throwing subscriber that doesn't take down its siblings or the emitter.
 */
import { storeEvents } from '../storePubSub';

// Reach a fresh bus instance to model jest's per-file module reset / a fresh
// app runtime, without depending on the shared singleton's accumulated state.
type BusCtor = new () => typeof storeEvents;
const FreshBus = (storeEvents as unknown as { constructor: BusCtor }).constructor;
const makeBus = () => new FreshBus();

describe('StoreEventBus.subscribeOnce', () => {
  it('registers a handler the first time a key is seen', async () => {
    const bus = makeBus();
    const handler = jest.fn();

    bus.subscribeOnce('evt', handler, 'key-a');
    await bus.emit('evt', { value: 1 });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ value: 1 });
  });

  it('does not stack a duplicate handler for a repeated key', async () => {
    const bus = makeBus();
    const handler = jest.fn();

    bus.subscribeOnce('evt', handler, 'key-a');
    bus.subscribeOnce('evt', handler, 'key-a'); // HMR / double-import
    bus.subscribeOnce('evt', jest.fn(), 'key-a'); // even a different callback
    await bus.emit('evt', {});

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('registers distinct keys independently', async () => {
    const bus = makeBus();
    const a = jest.fn();
    const b = jest.fn();

    bus.subscribeOnce('evt', a, 'key-a');
    bus.subscribeOnce('evt', b, 'key-b');
    await bus.emit('evt', {});

    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
  });

  it('re-registers the same key on a fresh bus instance', async () => {
    // The trap a globalThis flag would fall into: jest gives each test file a
    // fresh bus (module reset), so the dedup state must live on the instance.
    const first = makeBus();
    const handlerA = jest.fn();
    first.subscribeOnce('evt', handlerA, 'shared-key');

    const second = makeBus();
    const handlerB = jest.fn();
    second.subscribeOnce('evt', handlerB, 'shared-key');
    await second.emit('evt', {});

    expect(handlerB).toHaveBeenCalledTimes(1);
  });

  it('allows re-subscription after unsubscribe', async () => {
    const bus = makeBus();
    const handler = jest.fn();

    const sub = bus.subscribeOnce('evt', handler, 'key-a');
    sub.unsubscribe();
    bus.subscribeOnce('evt', handler, 'key-a');
    await bus.emit('evt', {});

    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe('StoreEventBus.emit error isolation', () => {
  it('runs every handler even when one throws, and resolves', async () => {
    const bus = makeBus();
    const before = jest.fn();
    const after = jest.fn();
    bus.subscribe('evt', before);
    bus.subscribe('evt', () => {
      throw new Error('handler boom');
    });
    bus.subscribe('evt', after);

    await expect(bus.emit('evt', {})).resolves.toBeUndefined();
    expect(before).toHaveBeenCalledTimes(1);
    expect(after).toHaveBeenCalledTimes(1);
  });

  it('swallows an async handler rejection without rejecting emit', async () => {
    const bus = makeBus();
    const sibling = jest.fn();
    bus.subscribe('evt', async () => {
      throw new Error('async boom');
    });
    bus.subscribe('evt', sibling);

    await expect(bus.emit('evt', {})).resolves.toBeUndefined();
    expect(sibling).toHaveBeenCalledTimes(1);
  });
});
