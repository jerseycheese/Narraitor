/**
 * @jest-environment node
 *
 * Unit tests for the test audit's over-mocking detectors. Fixture strings only.
 */

import {
  isMockPlusFiller,
  isMockEcho,
  isCallbackContract,
  promisedCollaboratorMocks,
  resolveSpec,
  mockedModules,
  extractFileModuleSpecs,
} from '../audit-tests-lib.cjs';

describe('isMockPlusFiller', () => {
  it('flags call-checks padded with existence checks', () => {
    expect(
      isMockPlusFiller([
        'expect(save).toHaveBeenCalledWith(world);',
        'expect(result).toBeDefined();',
      ]),
    ).toBe(true);
  });

  it('leaves pure mock-only and real value assertions alone', () => {
    expect(isMockPlusFiller(['expect(save).toHaveBeenCalled();'])).toBe(false);
    expect(
      isMockPlusFiller([
        'expect(save).toHaveBeenCalled();',
        "expect(result.name).toBe('Aria');",
      ]),
    ).toBe(false);
  });
});

describe('isMockEcho', () => {
  it('flags a case that asserts the stub it set up', () => {
    const body = 'mockLoad.mockResolvedValue(savedWorld);\nconst out = await load();\nexpect(out).toEqual(savedWorld);';
    expect(isMockEcho(body, ['expect(out).toEqual(savedWorld);'])).toBe(true);
  });

  it('does not flag a stub routed somewhere new or a boolean branch stub', () => {
    const routed = "mockGetKey.mockResolvedValue('byo-key');";
    expect(isMockEcho(routed, ["expect(headers.get('x-key')).toBe('byo-key');"])).toBe(false);
    const branch = 'mockIsTest.mockReturnValue(true);';
    expect(isMockEcho(branch, ['expect(shouldExpose).toBe(true);'])).toBe(false);
  });
});

describe('isCallbackContract', () => {
  it('treats callback props and router spies as the contract', () => {
    expect(isCallbackContract(['expect(mockProps.onSave).toHaveBeenCalledWith(x);'])).toBe(true);
    expect(isCallbackContract(["expect(mockReplace).toHaveBeenCalledWith('/play');"])).toBe(true);
  });

  it('does not excuse a mocked store setter', () => {
    expect(isCallbackContract(['expect(mockAddDecision).toHaveBeenCalled();'])).toBe(false);
  });
});

describe('promisedCollaboratorMocks', () => {
  const text = "jest.mock('@/state/narrativeStore');\njest.mock('next/navigation');\njest.mock('../Child');";

  it('lists local mocks in a file whose name promises persistence', () => {
    expect(promisedCollaboratorMocks('src/x/Foo.persistence.test.tsx', text)).toEqual([
      '@/state/narrativeStore',
      '../Child',
    ]);
  });

  it('ignores files that promise nothing', () => {
    expect(promisedCollaboratorMocks('src/x/Foo.test.tsx', text)).toEqual([]);
  });
});

describe('mockedModules', () => {
  it('resolves alias and relative specifiers to the same module', () => {
    expect(resolveSpec('@/lib/api/characterApi', 'src/app/page.test.tsx')).toBe('src/lib/api/characterApi');
    expect(resolveSpec('../characterApi', 'src/lib/api/__tests__/characterApi.test.ts')).toBe(
      'src/lib/api/characterApi',
    );
    expect(resolveSpec('react', 'src/a.test.ts')).toBeNull();
  });

  it('reports modules mocked in several files with the tests that import them for real', () => {
    const mocker = (rel) => ({
      rel,
      text: "import { generate } from '@/lib/api/characterApi';\njest.mock('@/lib/api/characterApi');",
    });
    const files = [
      mocker('src/app/a.test.tsx'),
      mocker('src/app/b.test.tsx'),
      mocker('src/app/c.test.tsx'),
      { rel: 'src/lib/api/__tests__/characterApi.test.ts', text: "import { generate } from '../characterApi';" },
    ];
    expect(mockedModules(files, 3)).toEqual([
      {
        module: 'src/lib/api/characterApi',
        mockedIn: 3,
        realTests: ['src/lib/api/__tests__/characterApi.test.ts'],
      },
    ]);
  });

  it('ignores fixture strings when counting mocked modules', () => {
    const files = [
      { rel: 'src/app/a.test.tsx', text: "jest.mock('@/lib/api/characterApi');" },
      { rel: 'src/app/b.test.tsx', text: "jest.mock('@/lib/api/characterApi');" },
      {
        rel: 'scripts/__tests__/audit-tests-lib.test.js',
        text: 'const fixture = "jest.mock(\'@/lib/api/characterApi\')";\n// jest.mock(\'@/lib/api/characterApi\');',
      },
    ];
    expect(mockedModules(files, 3)).toEqual([]);
  });

  it('excludes type-only imports from runtime real-test counts', () => {
    const files = [
      { rel: 'src/app/a.test.tsx', text: "jest.mock('@/state/characterStore');" },
      { rel: 'src/app/b.test.tsx', text: "jest.mock('@/state/characterStore');" },
      { rel: 'src/app/c.test.tsx', text: "jest.mock('@/state/characterStore');" },
      {
        rel: 'src/components/Dashboard/__tests__/DashboardContinueCard.test.tsx',
        text: "import type { StoreCharacter } from '@/state/characterStore';",
      },
      {
        rel: 'src/components/Dashboard/__tests__/DashboardOther.test.tsx',
        text: "import { type StoreCharacter } from '@/state/characterStore';",
      },
      {
        rel: 'src/state/__tests__/characterStore.test.ts',
        text: "import { useCharacterStore } from '@/state/characterStore';",
      },
    ];
    expect(mockedModules(files, 3)).toEqual([
      {
        module: 'src/state/characterStore',
        mockedIn: 3,
        realTests: ['src/state/__tests__/characterStore.test.ts'],
      },
    ]);
  });
});

describe('extractFileModuleSpecs', () => {
  it('extracts real mocks and runtime imports while ignoring comments and strings', () => {
    const text = `
      // jest.mock('@/commented')
      /* import { x } from '@/blockCommented'; */
      const fixture = "jest.mock('@/inString')";
      jest.mock('@/realMock');
      import { realImport } from '@/realImport';
      const req = require('@/realRequire');
    `;
    expect(extractFileModuleSpecs(text)).toEqual({
      mocks: ['@/realMock'],
      runtimeImports: ['@/realImport', '@/realRequire'],
    });
  });

  it('distinguishes type-only imports from runtime imports', () => {
    const text = `
      import type { OnlyType } from '@/typeOnly';
      import { type A, type B } from '@/inlineTypeOnly';
      import { A, type B } from '@/mixedImport';
      import DefaultItem, { type C } from '@/defaultPlusType';
    `;
    expect(extractFileModuleSpecs(text)).toEqual({
      mocks: [],
      runtimeImports: ['@/mixedImport', '@/defaultPlusType'],
    });
  });
});
