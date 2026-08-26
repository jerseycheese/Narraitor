// src/components/Narrative/__tests__/ChoiceOutcomeCallout.test.tsx

import { render, screen } from '@testing-library/react';
import { ChoiceOutcomeCallout } from '../ChoiceOutcomeCallout';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useNPCStore } from '@/state/npcStore';
import { useWorldStore } from '@/state/worldStore';

describe('ChoiceOutcomeCallout', () => {
  const defaultProps = {
    decisionId: 'decision-123',
    decisionText: 'You choose to help the merchant',
  };

  it('should display decision text', () => {
    render(<ChoiceOutcomeCallout {...defaultProps} />);

    expect(screen.getByText(/You choose to help the merchant/)).toBeInTheDocument();
  });

  it('should render callout with decision id', () => {
    render(<ChoiceOutcomeCallout {...defaultProps} />);

    const badge = screen.getByText(/You choose to help the merchant/).closest('[data-decision-id]');
    expect(badge).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    const { container } = render(
      <ChoiceOutcomeCallout {...defaultProps} className="test-class" />
    );

    const callout = container.querySelector('.choice-outcome-callout');
    expect(callout).toBeInTheDocument();
    expect(callout).toHaveClass('test-class');
  });

  it('should handle various decision text formats', () => {
    const testCases = [
      'You choose to attack the enemy',
      'You choose to help them',
      'You choose to run away quickly',
      'You choose to investigate the area',
    ];

    testCases.forEach((text) => {
      const { unmount } = render(
        <ChoiceOutcomeCallout {...defaultProps} decisionText={text} />
      );
      expect(screen.getByText(new RegExp(text))).toBeInTheDocument();
      unmount();
    });
  });

  it('should render outcome details when provided', () => {
    render(
      <ChoiceOutcomeCallout
        {...defaultProps}
        decisionOutcome="success"
      />
    );

    expect(screen.getByText('Success')).toBeInTheDocument();
  });

  it('should switch to attempt phrasing for failed outcomes', () => {
    render(
      <ChoiceOutcomeCallout
        {...defaultProps}
        decisionOutcome="failure"
      />
    );

    expect(
      screen.getByText(/You attempt to help the merchant/)
    ).toBeInTheDocument();
  });
});

describe('ChoiceOutcomeCallout consequence chips', () => {
  beforeEach(() => {
    useNarrativeStore.setState({ decisions: {} });
    useNPCStore.setState({
      npcs: {
        'npc-1': {
          id: 'npc-1',
          name: 'Marta',
          description: '',
          worldId: 'world-1',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      },
    });
  });

  it('renders no chips when the decision has no consequences', () => {
    const { container } = render(
      <ChoiceOutcomeCallout decisionId="decision-x" decisionText="You choose to wait" />
    );

    expect(container.querySelector('.choice-outcome-consequences')).toBeNull();
  });

  it('renders trust and alignment chips for the selected option', () => {
    useNarrativeStore.setState({
      decisions: {
        'decision-1': {
          id: 'decision-1',
          prompt: 'What now?',
          selectedOptionId: 'opt-1',
          options: [
            {
              id: 'opt-1',
              text: 'Pocket the ledger',
              alignment: 'chaotic',
              consequences: [
                { type: 'relationship', action: 'modify', targetId: 'npc-1', value: { trustDelta: -15 } },
                { type: 'alignment', action: 'add', targetId: 'player-alignment', value: -8 },
              ],
            },
          ],
        },
      },
    });

    const { container } = render(
      <ChoiceOutcomeCallout decisionId="decision-1" decisionText="You choose to pocket the ledger" />
    );

    expect(screen.getByText('Marta −15 trust')).toBeInTheDocument();
    expect(screen.getByText('Chaos +8')).toBeInTheDocument();
    expect(container.querySelectorAll('.choice-outcome-chip')).toHaveLength(2);
  });

  it('skips relationship chips whose NPC cannot be resolved', () => {
    useNarrativeStore.setState({
      decisions: {
        'decision-2': {
          id: 'decision-2',
          prompt: 'What now?',
          selectedOptionId: 'opt-1',
          options: [
            {
              id: 'opt-1',
              text: 'Help the stranger',
              alignment: 'lawful',
              consequences: [
                { type: 'relationship', action: 'modify', targetId: 'npc-unknown', value: { trustDelta: 10 } },
                { type: 'alignment', action: 'add', targetId: 'player-alignment', value: 4 },
              ],
            },
          ],
        },
      },
    });

    const { container } = render(
      <ChoiceOutcomeCallout decisionId="decision-2" decisionText="You choose to help" />
    );

    expect(container.querySelectorAll('.choice-outcome-chip')).toHaveLength(1);
    expect(screen.getByText('Order +4')).toBeInTheDocument();
  });

  it('leaves a typed action alone on a failed outcome', () => {
    useNarrativeStore.setState({
      decisions: {
        'decision-4': {
          id: 'decision-4',
          prompt: 'What now?',
          selectedOptionId: 'opt-custom',
          options: [
            {
              id: 'opt-custom',
              text: 'I walk over to the mill and ask who holds the debt',
              isCustomInput: true,
              customText: 'I walk over to the mill and ask who holds the debt',
            },
          ],
        },
      },
    });

    render(
      <ChoiceOutcomeCallout
        decisionId="decision-4"
        decisionText="I walk over to the mill and ask who holds the debt"
        decisionOutcome="failure"
      />
    );

    expect(
      screen.getByText('I walk over to the mill and ask who holds the debt')
    ).toBeInTheDocument();
    expect(screen.queryByText(/You attempt to/)).not.toBeInTheDocument();
  });

  it('repairs a typed action persisted in the old mangled form', () => {
    useNarrativeStore.setState({
      decisions: {
        'decision-5': {
          id: 'decision-5',
          prompt: 'What now?',
          selectedOptionId: 'opt-custom',
          options: [
            {
              id: 'opt-custom',
              text: 'i ask Martha Hendricks what they want',
              isCustomInput: true,
              customText: 'i ask Martha Hendricks what they want',
            },
          ],
        },
      },
    });

    render(
      <ChoiceOutcomeCallout
        decisionId="decision-5"
        decisionText="You choose to i ask Martha Hendricks what they want"
      />
    );

    expect(
      screen.getByText('I ask Martha Hendricks what they want')
    ).toBeInTheDocument();
  });

  it('surfaces the actual shift size rather than a fixed label', () => {
    useNarrativeStore.setState({
      decisions: {
        'decision-3': {
          id: 'decision-3',
          prompt: 'What now?',
          selectedOptionId: 'opt-1',
          options: [
            {
              id: 'opt-1',
              text: 'Swear the oath twice over',
              alignment: 'lawful',
              consequences: [
                { type: 'alignment', action: 'add', targetId: 'player-alignment', value: 4 },
                { type: 'alignment', action: 'add', targetId: 'player-alignment', value: 12 },
              ],
            },
          ],
        },
      },
    });

    render(
      <ChoiceOutcomeCallout decisionId="decision-3" decisionText="You choose to swear the oath" />
    );

    expect(screen.getByText('Order +4')).toBeInTheDocument();
    expect(screen.getByText('Order +12')).toBeInTheDocument();
  });
});

describe('ChoiceOutcomeCallout skill name in outcome label', () => {
  beforeEach(() => {
    useNPCStore.setState({ npcs: {} });
  });

  it('folds the skill name into the label when the world skill is resolvable', () => {
    (useWorldStore.getState as jest.Mock).mockReturnValue({
      worlds: {
        'world-1': {
          id: 'world-1',
          skills: [{ id: 'skill-stealth', name: 'Stealth' }],
        },
      },
    });

    useNarrativeStore.setState({
      decisions: {
        'decision-skill': {
          id: 'decision-skill',
          prompt: 'What do you do?',
          selectedOptionId: 'opt-skill',
          options: [
            {
              id: 'opt-skill',
              text: 'Sneak past',
              requirements: [{ type: 'skill', targetId: 'skill-stealth', operator: 'gte', value: 3 }],
            },
          ],
        },
      },
    });

    render(
      <ChoiceOutcomeCallout
        decisionId="decision-skill"
        decisionText="You sneak past"
        decisionOutcome="success"
      />
    );

    expect(screen.getByText('Success · Stealth')).toBeInTheDocument();
  });

  it('falls back to the bare outcome label when the skill cannot be resolved', () => {
    (useWorldStore.getState as jest.Mock).mockReturnValue({ worlds: {} });

    useNarrativeStore.setState({
      decisions: {
        'decision-unknown-skill': {
          id: 'decision-unknown-skill',
          prompt: 'What do you do?',
          selectedOptionId: 'opt-unknown',
          options: [
            {
              id: 'opt-unknown',
              text: 'Try something',
              requirements: [{ type: 'skill', targetId: 'skill-does-not-exist', operator: 'gte', value: 3 }],
            },
          ],
        },
      },
    });

    render(
      <ChoiceOutcomeCallout
        decisionId="decision-unknown-skill"
        decisionText="You try something"
        decisionOutcome="success"
      />
    );

    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.queryByText(/·/)).not.toBeInTheDocument();
  });

  it('lists all contributing skills for multi-skill actions', () => {
    (useWorldStore.getState as jest.Mock).mockReturnValue({
      worlds: {
        'world-1': {
          id: 'world-1',
          skills: [
            { id: 'skill-stealth', name: 'Stealth' },
            { id: 'skill-hacking', name: 'Hacking' },
          ],
        },
      },
    });

    useNarrativeStore.setState({
      decisions: {
        'decision-multi-skill': {
          id: 'decision-multi-skill',
          prompt: 'What do you do?',
          selectedOptionId: 'opt-multi',
          options: [
            {
              id: 'opt-multi',
              text: 'Hack security while sneaking past',
              requirements: [
                { type: 'skill', targetId: 'skill-stealth', operator: 'gte', value: 3 },
                { type: 'skill', targetId: 'skill-hacking', operator: 'gte', value: 4 },
              ],
            },
          ],
        },
      },
    });

    render(
      <ChoiceOutcomeCallout
        decisionId="decision-multi-skill"
        decisionText="You hack security while sneaking past"
        decisionOutcome="mixed"
      />
    );

    expect(screen.getByText('Mixed · Stealth, Hacking')).toBeInTheDocument();
  });
});


