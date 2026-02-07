    let activeDrawerTrigger = null;
    let activeEndStoryTrigger = null;
    let manuscriptOverlayLauncher = null;
    const manuscriptHudPairs = [
      {
        buttonId: 'manuscript-hud-left-toggle',
        panelId: 'manuscript-hud-left-panel',
      },
      {
        buttonId: 'manuscript-hud-right-toggle',
        panelId: 'manuscript-hud-right-panel',
      },
    ];
    const manuscriptSourceRecords = {
      session: {
        id: 'session-cyberpunk-ghost',
        worldId: 'world-cyberpunk-2077',
        characterId: 'char-cyberpunk-hacker',
        status: 'active',
      },
      character: {
        id: 'char-cyberpunk-hacker',
        name: 'Nova "Ghost" Chen',
        level: 3,
        description: 'Elite corporate hacker turned underground resistance fighter',
        backgroundHistory: 'Former Arasaka security specialist who discovered dark corporate secrets',
        location: 'Neo-Tokyo Underground',
        attributes: [
          { id: 'char-attr-tech-level', name: 'Tech Level', baseValue: 8, modifiedValue: 8 },
          { id: 'char-attr-street-cred', name: 'Street Cred', baseValue: 6, modifiedValue: 6 },
        ],
        skills: [
          { id: 'char-skill-hacking', worldSkillId: 'skill-world-cyberpunk-2077-1', name: 'Hacking', level: 12 },
          { id: 'char-skill-streetwise', worldSkillId: 'skill-world-cyberpunk-2077-2', name: 'Streetwise', level: 8 },
        ],
      },
      inventoryItems: [
        {
          id: 'inventory-ghostlink-cyberdeck',
          characterId: 'char-cyberpunk-hacker',
          name: 'Ghostlink Cyberdeck',
          description: 'Signature deck tuned to slip past Arasaka intrusion countermeasures.',
          quantity: 1,
          imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=cyberdeck&backgroundColor=1e293b&scale=80',
        },
        {
          id: 'inventory-neuro-stims',
          characterId: 'char-cyberpunk-hacker',
          name: 'NeuroBoost Stims',
          description: 'Fast-acting injectors that keep reflexes sharp during breach attempts.',
          quantity: 3,
          imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=neurostim&backgroundColor=3b82f6&scale=80',
        },
        {
          id: 'inventory-black-ice-shard',
          characterId: 'char-cyberpunk-hacker',
          name: 'Black ICE Shard',
          description: 'Prototype defensive program that can be slotted into the deck on demand.',
          quantity: 1,
          imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=blackice&backgroundColor=7c3aed&scale=80',
        },
      ],
      narrativeSegments: [
        {
          id: 'segment-cyberpunk-1',
          sessionId: 'session-cyberpunk-ghost',
          type: 'scene',
          characterIds: ['char-cyberpunk-hacker'],
          content: 'Rain pelts the neon-soaked streets of Neo-Tokyo as you crouch behind a hover-car, fingers dancing across your portable deck. The *Arasaka building* looms ahead, its security algorithms pulsing like a **digital heartbeat**.',
          metadata: {
            location: 'Starting Location',
            characterIds: ['char-cyberpunk-hacker'],
          },
        },
        {
          id: 'segment-cyberpunk-2',
          sessionId: 'session-cyberpunk-ghost',
          type: 'dialogue',
          characterIds: ['char-cyberpunk-hacker'],
          content: '"Nice deck," a voice says from the shadows. "*Arasaka custom job, looks like.*" The fixer steps into the dim light, **chrome eyes gleaming**.',
          metadata: {
            location: 'Neo-Tokyo alley',
            characterIds: ['char-cyberpunk-hacker', 'npc-fixer'],
          },
        },
        {
          id: 'segment-cyberpunk-3',
          sessionId: 'session-cyberpunk-ghost',
          type: 'action',
          characterIds: ['char-cyberpunk-hacker'],
          content: 'You crawl through the ventilation shaft, your tools muffling the hum of fans and alarms. Inside, the building pulses with corporate efficiency. Security drones patrol the upper floors in predictable patterns.',
          metadata: {
            location: 'Arasaka building interior',
            characterIds: ['char-cyberpunk-hacker'],
            causedByDecisionId: 'decision-cyberpunk-route',
            causedByDecisionText: 'You choose to crawl through the ventilation system - stealthy but difficult',
            decisionOutcome: 'success',
          },
        },
        {
          id: 'segment-cyberpunk-4',
          sessionId: 'session-cyberpunk-ghost',
          type: 'transition',
          characterIds: ['char-cyberpunk-hacker'],
          content: 'Hours pass. The city breathes outside, unaware of the digital heist unfolding in the shadows.',
          metadata: {
            location: 'Arasaka building',
            characterIds: ['char-cyberpunk-hacker'],
          },
        },
      ],
      decisions: [
        {
          id: 'decision-cyberpunk-route',
          prompt: 'How do you want to reach the 47th floor?',
          decisionWeight: 'major',
          selectedOptionId: 'option-ventilation',
          selectedAt: '2024-01-01T02:02:00.000Z',
          characterId: 'char-cyberpunk-hacker',
          contextSummary: 'Infiltrating Arasaka building to steal critical data',
          narrativeSegmentId: 'segment-cyberpunk-2',
          options: [
            {
              id: 'option-elevator',
              text: 'Take the maintenance elevator - quieter but slower',
              alignment: 'neutral',
              hint: 'Lower risk of detection but takes more time',
              requirements: [{ type: 'skill', targetId: 'skill-hacking', operator: 'gte', value: 10 }],
            },
            {
              id: 'option-stairs',
              text: 'Use the emergency stairs - faster but riskier',
              alignment: 'chaotic',
              hint: 'Quick route but higher chance of encountering security',
              requirements: [{ type: 'skill', targetId: 'skill-streetwise', operator: 'gte', value: 8 }],
            },
            {
              id: 'option-ventilation',
              text: 'Crawl through the ventilation system - stealthy but difficult',
              alignment: 'lawful',
              hint: 'Requires high tech skill but nearly undetectable',
              requirements: [
                { type: 'skill', targetId: 'skill-hacking', operator: 'gte', value: 14 },
                { type: 'skill', targetId: 'skill-streetwise', operator: 'gte', value: 10 },
              ],
            },
          ],
        },
      ],
      journalEntries: [
        {
          id: 'entry-cyberpunk-decision',
          sessionId: 'session-cyberpunk-ghost',
          type: 'decision',
          title: 'Decision',
          content: 'Chose the ventilation route to avoid the main lobby scanners.',
          detailedContent: 'Nova reroutes power to the ventilation shafts, trusting stealth over speed. The detour buys time and keeps Arasaka\'s lobby scanners blind.',
        },
        {
          id: 'entry-cyberpunk-discovery',
          sessionId: 'session-cyberpunk-ghost',
          type: 'discovery',
          title: 'Discovery',
          content: 'Found a hidden relay broadcasting Arasaka executive calls.',
          detailedContent: 'A concealed relay node pulses beneath the floor panel, routing encrypted executive calls. The signal pattern suggests a private line to the board.',
        },
        {
          id: 'entry-cyberpunk-world-event',
          sessionId: 'session-cyberpunk-ghost',
          type: 'world_event',
          title: 'World Event',
          content: 'Security drones sweep the corridor as alarms spike.',
          detailedContent: 'Alarms crackle to life as a wave of security drones sweeps the executive corridor. The neon haze outside flickers with emergency broadcasts.',
        },
      ],
    };

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function formatEntryType(type) {
      return String(type).replace(/_/g, ' ').toUpperCase();
    }

    function stripMarkdownFormatting(content) {
      return String(content || '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1');
    }

    function normalizeIdentifier(value) {
      return String(value || '').trim().toLowerCase();
    }

    function deriveFallbackCharacterName(characterId) {
      const cleaned = String(characterId || '')
        .replace(/^npc[-_]?/i, '')
        .replace(/[-_]/g, ' ')
        .trim();

      if (!cleaned) {
        return 'Unknown NPC';
      }

      return `NPC ${cleaned}`;
    }

    function getSegmentCharacterIds(segment) {
      const uniqueIds = new Map();
      const addId = (value) => {
        const trimmed = String(value || '').trim();
        if (!trimmed) {
          return;
        }

        const normalized = normalizeIdentifier(trimmed);
        if (!uniqueIds.has(normalized)) {
          uniqueIds.set(normalized, trimmed);
        }
      };

      (segment.characterIds || []).forEach(addId);
      ((segment.metadata && segment.metadata.characterIds) || []).forEach(addId);

      return Array.from(uniqueIds.values());
    }

    function resolveCharacterName(characterId) {
      if (characterId === manuscriptSourceRecords.character.id) {
        return manuscriptSourceRecords.character.name;
      }

      return deriveFallbackCharacterName(characterId);
    }

    function renderManuscriptNarrativeFromSourceRecords() {
      const narrativeStream = document.getElementById('manuscript-narrative-stream');
      const charactersPresentList = document.getElementById('manuscript-characters-present-list');
      const charactersPresentMobileList = document.getElementById('manuscript-characters-present-mobile-list');
      if (!narrativeStream || !charactersPresentList || !charactersPresentMobileList) {
        return;
      }

      const sessionNarrativeSegments = manuscriptSourceRecords.narrativeSegments.filter(
        (segment) => segment.sessionId === manuscriptSourceRecords.session.id,
      );

      if (sessionNarrativeSegments.length === 0) {
        narrativeStream.innerHTML = '<p style="color: var(--color-text-secondary);">No narrative segments found for this session.</p>';
        charactersPresentList.innerHTML = '<p class="text-xs" style="color: var(--color-text-secondary);">No participants recorded.</p>';
        charactersPresentMobileList.innerHTML = '<p class="text-xs" style="color: var(--color-text-secondary);">No participants recorded.</p>';
        return;
      }

      const activeSegmentForParticipants = (() => {
        for (let index = sessionNarrativeSegments.length - 1; index >= 0; index -= 1) {
          const segment = sessionNarrativeSegments[index];
          if (getSegmentCharacterIds(segment).length > 0) {
            return segment;
          }
        }
        return sessionNarrativeSegments[sessionNarrativeSegments.length - 1];
      })();
      const activeSegmentCharacterIds = activeSegmentForParticipants
        ? getSegmentCharacterIds(activeSegmentForParticipants)
        : [];

      const participantMarkup = activeSegmentCharacterIds.length > 0
        ? activeSegmentCharacterIds.map((characterId) => `<span class="inline-flex items-center rounded-sm px-2 py-1 text-xs font-interface" style="background: var(--color-surface-hover); border: 1px solid var(--color-border); color: var(--color-text-secondary);">${escapeHtml(resolveCharacterName(characterId))}</span>`).join('')
        : '<p class="text-xs" style="color: var(--color-text-secondary);">No participants recorded.</p>';

      charactersPresentList.innerHTML = participantMarkup;
      charactersPresentMobileList.innerHTML = participantMarkup;

      narrativeStream.innerHTML = sessionNarrativeSegments.map((segment) => {
        const metadata = segment.metadata || {};
        const hasDecisionOutcome = Boolean(metadata.causedByDecisionId && metadata.causedByDecisionText);
        const outcomeLabel = metadata.decisionOutcome
          ? `OUTCOME: ${formatEntryType(String(metadata.decisionOutcome).replace(/-/g, '_'))}`
          : 'OUTCOME: DECISION';

        const outcomeMarkup = hasDecisionOutcome
          ? `<div class="rounded-sm p-4 border-l-4" style="border-left-color: var(--color-accent); background: rgba(49, 46, 129, 0.08);">
              <div class="font-system text-xs mb-1" style="color: var(--color-accent);">${escapeHtml(outcomeLabel)}</div>
              <p class="text-sm sm:text-base font-narrative italic" style="color: var(--color-text-secondary);">${escapeHtml(metadata.causedByDecisionText)}</p>
            </div>`
          : '';

        return `<article class="space-y-3">
          ${outcomeMarkup}
          <p class="text-narrative">${escapeHtml(stripMarkdownFormatting(segment.content))}</p>
        </article>`;
      }).join('');
    }

    function renderManuscriptChoiceActionsFromSourceRecords() {
      const decisionPrompt = document.getElementById('manuscript-decision-prompt');
      const choiceActions = document.getElementById('manuscript-choice-actions');
      const primaryDecision = manuscriptSourceRecords.decisions[0];

      if (!decisionPrompt || !choiceActions) {
        return;
      }

      if (!primaryDecision) {
        decisionPrompt.textContent = 'No decision records found.';
        choiceActions.innerHTML = '';
        return;
      }

      decisionPrompt.textContent = primaryDecision.prompt;

      choiceActions.innerHTML = primaryDecision.options.map((option) => {
        return `<button
            type="button"
            data-suggested-action="${escapeHtml(option.text)}"
            class="manuscript-suggested-action w-full min-w-0 text-left px-2.5 py-1.5 rounded-sm text-xs sm:text-sm font-interface font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            ${escapeHtml(option.text)}
          </button>`;
      }).join('');
    }

    function toggleTheme() {
      const html = document.documentElement;
      const currentTheme = html.getAttribute('data-theme');
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      html.setAttribute('data-theme', newTheme);
    }

    function toggleNav() {
      const button = document.getElementById('nav-toggle');
      const dropdown = document.getElementById('nav-dropdown');
      const isOpen = dropdown.classList.contains('open');

      if (isOpen) {
        closeNav();
      } else {
        // Open menu
        dropdown.classList.add('open');
        button.setAttribute('aria-expanded', 'true');
        dropdown.setAttribute('aria-hidden', 'false');

        // Move focus to first link
        setTimeout(() => {
          const firstLink = dropdown.querySelector('a');
          if (firstLink) firstLink.focus();
        }, 100);
      }
    }

    function closeNav() {
      const button = document.getElementById('nav-toggle');
      const dropdown = document.getElementById('nav-dropdown');

      if (!dropdown.classList.contains('open')) {
        return;
      }

      dropdown.classList.remove('open');
      button.setAttribute('aria-expanded', 'false');
      dropdown.setAttribute('aria-hidden', 'true');

      // Return focus to button
      button.focus();
    }

    function closeManuscriptPanelsMenu() {
      const menu = document.getElementById('manuscript-panels-menu');
      const headerToggle = document.getElementById('manuscript-panels-toggle');
      const railToggle = document.getElementById('manuscript-panels-toggle-rail');

      if (!menu || menu.hidden) {
        return;
      }

      menu.hidden = true;
      if (headerToggle) {
        headerToggle.setAttribute('aria-expanded', 'false');
      }
      if (railToggle) {
        railToggle.setAttribute('aria-expanded', 'false');
      }
    }

    function closeManuscriptHudPanels(excludeButtonId = null) {
      manuscriptHudPairs.forEach(({ buttonId, panelId }) => {
        if (excludeButtonId && excludeButtonId === buttonId) {
          return;
        }

        const button = document.getElementById(buttonId);
        const panel = document.getElementById(panelId);
        if (!button || !panel) {
          return;
        }

        button.setAttribute('aria-expanded', 'false');
        panel.hidden = true;
      });
    }

    function renderManuscriptHudFromSourceRecords() {
      const characterStatsContainer = document.getElementById('manuscript-character-hud-stats');
      const sessionId = document.getElementById('manuscript-session-id');
      const sessionStatus = document.getElementById('manuscript-session-status');
      const sessionNarrativeCount = document.getElementById('manuscript-session-narrative-count');

      if (characterStatsContainer) {
        const rowsFor = (items, valueKey) => items.map(
          (item) => `<div class="flex justify-between">
            <dt style="color: var(--color-text-secondary);">${escapeHtml(item.name)}</dt>
            <dd style="color: var(--color-text-primary);">${escapeHtml(item[valueKey])}</dd>
          </div>`,
        ).join('');

        const attributes = manuscriptSourceRecords.character.attributes || [];
        const skills = manuscriptSourceRecords.character.skills || [];
        const attributeSection = attributes.length > 0
          ? `<section>
              <h5 class="font-system text-[11px] mb-1" style="color: var(--color-text-muted);">ATTRIBUTES</h5>
              <dl class="space-y-1 text-sm">${rowsFor(attributes, 'modifiedValue')}</dl>
            </section>`
          : '';
        const skillSection = skills.length > 0
          ? `<section>
              <h5 class="font-system text-[11px] mb-1" style="color: var(--color-text-muted);">SKILLS</h5>
              <dl class="space-y-1 text-sm">${rowsFor(skills, 'level')}</dl>
            </section>`
          : '';

        characterStatsContainer.innerHTML = `
          <section>
            <dl class="space-y-1 text-sm">
              <div class="flex justify-between">
                <dt style="color: var(--color-text-secondary);">Level</dt>
                <dd style="color: var(--color-text-primary);">${escapeHtml(manuscriptSourceRecords.character.level)}</dd>
              </div>
            </dl>
          </section>
          ${attributeSection}
          ${skillSection}
        `;
      }

      if (sessionId) {
        sessionId.textContent = manuscriptSourceRecords.session.id;
      }
      if (sessionStatus) {
        sessionStatus.textContent = manuscriptSourceRecords.session.status;
      }
      if (sessionNarrativeCount) {
        const sessionNarrativeSegments = manuscriptSourceRecords.narrativeSegments.filter(
          (segment) => segment.sessionId === manuscriptSourceRecords.session.id,
        );
        sessionNarrativeCount.textContent = String(sessionNarrativeSegments.length);
      }
    }

    function openManuscriptOverlay() {
      const overlay = document.getElementById('manuscript-viewport-layer');
      const closeButton = document.getElementById('close-manuscript-overlay');

      if (!overlay || !closeButton) {
        return;
      }

      overlay.classList.remove('hidden');
      overlay.setAttribute('aria-hidden', 'false');

      if (manuscriptOverlayLauncher) {
        manuscriptOverlayLauncher.setAttribute('aria-expanded', 'true');
      }

      document.body.style.overflow = 'hidden';
      closeButton.focus();
    }

    function closeManuscriptOverlay() {
      const overlay = document.getElementById('manuscript-viewport-layer');

      if (!overlay || overlay.classList.contains('hidden')) {
        return;
      }

      closeManuscriptEndStoryModal();
      closeManuscriptPanelsMenu();
      closeManuscriptHudPanels();
      closeManuscriptDrawer();
      overlay.classList.add('hidden');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';

      if (manuscriptOverlayLauncher) {
        manuscriptOverlayLauncher.setAttribute('aria-expanded', 'false');
        manuscriptOverlayLauncher.focus();
      }
    }

    function initManuscriptOverlayController() {
      const launchButton = document.getElementById('launch-manuscript-overlay');
      const overlay = document.getElementById('manuscript-viewport-layer');
      const closeButton = document.getElementById('close-manuscript-overlay');
      const backdrop = overlay ? overlay.querySelector('[data-manuscript-overlay-backdrop]') : null;

      if (!launchButton || !overlay || !closeButton || !backdrop) {
        return;
      }

      manuscriptOverlayLauncher = launchButton;

      launchButton.addEventListener('click', openManuscriptOverlay);
      closeButton.addEventListener('click', closeManuscriptOverlay);
      backdrop.addEventListener('click', closeManuscriptOverlay);
    }

    function initManuscriptInputController() {
      const input = document.getElementById('manuscript-input');
      const sendButton = document.getElementById('manuscript-send');
      const simulateTurnButton = document.getElementById('manuscript-simulate-turn');
      const charCount = document.getElementById('manuscript-char-count');
      const toggleSuggestedActionsButton = document.getElementById('manuscript-toggle-suggested-actions');
      const suggestedActionsRegion = document.getElementById('manuscript-suggested-actions-region');
      const toggleEndingSuggestionButton = document.getElementById('manuscript-toggle-ending-suggestion');
      const endingSuggestion = document.getElementById('manuscript-ending-suggestion');
      const endingAcceptButton = document.getElementById('manuscript-ending-accept');
      const endingDismissButton = document.getElementById('manuscript-ending-dismiss');
      const endStoryButton = document.getElementById('manuscript-end-story');
      const endStoryModal = document.getElementById('manuscript-end-story-modal');
      const endStoryDialog = document.getElementById('manuscript-end-story-dialog');
      const endStoryCancel = document.getElementById('manuscript-end-story-cancel');
      const endStoryConfirm = document.getElementById('manuscript-end-story-confirm');
      const endStoryBackdrop = endStoryModal ? endStoryModal.querySelector('[data-end-story-backdrop]') : null;
      const narrativeStream = document.getElementById('manuscript-narrative-stream');
      const narrativeScrollContainer = document.querySelector('.manuscript-overlay-main');
      const suggestedActionButtons = document.querySelectorAll('[data-suggested-action]');
      const manuscriptControlButtons = document.querySelectorAll('[data-manuscript-control]');
      const mobileMediaQuery = window.matchMedia('(max-width: 1023px)');

      if (!input || !sendButton || !charCount) {
        return;
      }

      let activeSuggestedActionButton = null;
      let simulatedTurnIndex = 0;
      const simulatedTurns = (() => {
        const primaryDecision = manuscriptSourceRecords.decisions[0];
        const journalTurns = manuscriptSourceRecords.journalEntries.filter(
          (entry) => entry.sessionId === manuscriptSourceRecords.session.id
            && ['decision', 'discovery', 'world_event'].includes(entry.type),
        );

        if (!primaryDecision || journalTurns.length === 0) {
          return [];
        }

        return journalTurns.map((entry, index) => ({
          actionLabel: primaryDecision.options[index % primaryDecision.options.length].text,
          outcomeLabel: `OUTCOME: ${formatEntryType(entry.type)}`,
          outcomeText: entry.content,
          narrativeText: entry.detailedContent || entry.content,
        }));
      })();

      const updateCount = () => {
        const count = input.value.length;
        charCount.textContent = `${count}/400`;
      };

      const setSuggestedActionsVisible = (isVisible) => {
        if (!(suggestedActionsRegion instanceof HTMLElement) || !(toggleSuggestedActionsButton instanceof HTMLElement)) {
          return;
        }

        suggestedActionsRegion.hidden = !isVisible;
        toggleSuggestedActionsButton.setAttribute('aria-expanded', String(isVisible));
        toggleSuggestedActionsButton.textContent = isVisible
          ? 'Hide Suggested Actions'
          : `Suggested Actions (${suggestedActionButtons.length})`;
      };

      const syncSuggestedActionsForViewport = () => {
        if (!(suggestedActionsRegion instanceof HTMLElement)) {
          return;
        }

        if (mobileMediaQuery.matches) {
          setSuggestedActionsVisible(false);
          return;
        }

        suggestedActionsRegion.hidden = false;
        if (toggleSuggestedActionsButton instanceof HTMLElement) {
          toggleSuggestedActionsButton.setAttribute('aria-expanded', 'true');
        }
      };

      const setEndingSuggestionVisible = (isVisible) => {
        if (!(endingSuggestion instanceof HTMLElement) || !(toggleEndingSuggestionButton instanceof HTMLElement)) {
          return;
        }

        endingSuggestion.hidden = !isVisible;
        toggleEndingSuggestionButton.setAttribute('aria-expanded', String(isVisible));
        toggleEndingSuggestionButton.textContent = isVisible ? 'Hide Ending Suggestion' : 'Show Ending Suggestion';
      };

      const openManuscriptEndStoryModal = (trigger) => {
        if (!(endStoryModal instanceof HTMLElement) || !(endStoryDialog instanceof HTMLElement)) {
          return;
        }

        endStoryModal.classList.remove('hidden');
        endStoryModal.setAttribute('aria-hidden', 'false');
        activeEndStoryTrigger = trigger || null;
        endStoryDialog.focus();
      };

      const setSuggestedButtonSelectedState = (button, isSelected) => {
        if (!(button instanceof HTMLElement)) {
          return;
        }

        button.classList.toggle('is-selected', isSelected);
        button.setAttribute('aria-pressed', String(isSelected));
      };

      const setActiveSuggestedActionButton = (nextButton) => {
        suggestedActionButtons.forEach((button) => {
          setSuggestedButtonSelectedState(button, button === nextButton);
        });

        activeSuggestedActionButton = nextButton;
      };

      const getNextSimulatedTurn = () => {
        if (simulatedTurns.length === 0) {
          return null;
        }

        const turn = simulatedTurns[simulatedTurnIndex % simulatedTurns.length];
        simulatedTurnIndex += 1;
        return turn;
      };

      const scrollNarrativeToBottom = () => {
        if (!(narrativeScrollContainer instanceof HTMLElement)) {
          return;
        }

        narrativeScrollContainer.scrollTop = narrativeScrollContainer.scrollHeight;
      };

      const appendNarrativeTurn = (actionText, simulatedTurn) => {
        if (!(narrativeStream instanceof HTMLElement)) {
          return;
        }

        const outcomeCard = document.createElement('div');
        outcomeCard.className = 'rounded-sm p-4 border-l-4';
        outcomeCard.style.borderLeftColor = 'var(--color-accent)';
        outcomeCard.style.background = 'rgba(49, 46, 129, 0.08)';

        const outcomeLabel = document.createElement('div');
        outcomeLabel.className = 'font-system text-xs mb-1';
        outcomeLabel.style.color = 'var(--color-accent)';
        outcomeLabel.textContent = simulatedTurn.outcomeLabel;

        const outcomeText = document.createElement('p');
        outcomeText.className = 'text-sm sm:text-base font-narrative italic';
        outcomeText.style.color = 'var(--color-text-secondary)';
        outcomeText.textContent = simulatedTurn.outcomeText;

        const actionEcho = document.createElement('p');
        actionEcho.className = 'text-sm font-interface mt-2';
        actionEcho.style.color = 'var(--color-text-muted)';
        actionEcho.textContent = `Action submitted: ${actionText}`;

        outcomeCard.appendChild(outcomeLabel);
        outcomeCard.appendChild(outcomeText);
        outcomeCard.appendChild(actionEcho);

        const narrativeParagraph = document.createElement('p');
        narrativeParagraph.className = 'text-narrative';
        narrativeParagraph.textContent = simulatedTurn.narrativeText;

        narrativeStream.appendChild(outcomeCard);
        narrativeStream.appendChild(narrativeParagraph);
        scrollNarrativeToBottom();
      };

      const submitAction = (actionText) => {
        const trimmedAction = actionText.trim();
        if (!trimmedAction) {
          return;
        }

        const nextTurn = getNextSimulatedTurn();
        if (!nextTurn) {
          return;
        }

        appendNarrativeTurn(trimmedAction, nextTurn);
        input.value = '';
        setActiveSuggestedActionButton(null);
        updateCount();
      };

      const applyInventoryUseActionToInput = (actionText) => {
        input.value = actionText;
        setActiveSuggestedActionButton(null);
        updateCount();
        closeManuscriptDrawer();
        input.focus();
      };

      suggestedActionButtons.forEach((button) => {
        button.addEventListener('click', () => {
          const suggestedAction = button.getAttribute('data-suggested-action');
          if (!suggestedAction) {
            return;
          }

          if (activeSuggestedActionButton === button) {
            input.value = '';
            setActiveSuggestedActionButton(null);
            updateCount();
            input.focus();
            return;
          }

          setActiveSuggestedActionButton(button);
          input.value = suggestedAction;
          updateCount();
          if (mobileMediaQuery.matches) {
            setSuggestedActionsVisible(false);
          }
          input.focus();
        });
      });

      if (toggleSuggestedActionsButton instanceof HTMLElement && suggestedActionsRegion instanceof HTMLElement) {
        toggleSuggestedActionsButton.addEventListener('click', () => {
          setSuggestedActionsVisible(suggestedActionsRegion.hidden);
        });
      }

      if (typeof mobileMediaQuery.addEventListener === 'function') {
        mobileMediaQuery.addEventListener('change', syncSuggestedActionsForViewport);
      } else if (typeof mobileMediaQuery.addListener === 'function') {
        mobileMediaQuery.addListener(syncSuggestedActionsForViewport);
      }

      const controlTargetsByKey = {
        'end-story': 'manuscript-end-story',
        'toggle-character-hud': 'manuscript-hud-left-toggle',
        'toggle-session-hud': 'manuscript-hud-right-toggle',
      };

      manuscriptControlButtons.forEach((controlButton) => {
        controlButton.addEventListener('click', () => {
          const controlKey = controlButton.getAttribute('data-manuscript-control');
          if (!controlKey) {
            return;
          }

          const targetId = controlTargetsByKey[controlKey];
          if (!targetId) {
            return;
          }

          const targetButton = document.getElementById(targetId);
          if (!(targetButton instanceof HTMLElement) || targetButton.hasAttribute('disabled')) {
            return;
          }

          targetButton.click();
        });
      });

      document.addEventListener('click', (event) => {
        const target = event.target instanceof Element
          ? event.target.closest('[data-manuscript-use-item]')
          : null;
        if (!(target instanceof HTMLElement)) {
          return;
        }

        const actionText = target.getAttribute('data-manuscript-use-item');
        if (!actionText || target.hasAttribute('disabled')) {
          return;
        }

        applyInventoryUseActionToInput(actionText);
      });

      sendButton.addEventListener('click', () => {
        submitAction(input.value);
      });

      if (simulateTurnButton) {
        simulateTurnButton.addEventListener('click', () => {
          const nextTurn = getNextSimulatedTurn();
          if (!nextTurn) {
            return;
          }

          appendNarrativeTurn(nextTurn.actionLabel, nextTurn);
          input.value = '';
          setActiveSuggestedActionButton(null);
          updateCount();
        });
      }

      if (toggleEndingSuggestionButton) {
        toggleEndingSuggestionButton.addEventListener('click', () => {
          setEndingSuggestionVisible(endingSuggestion ? endingSuggestion.hidden : false);
        });
      }

      if (endingDismissButton) {
        endingDismissButton.addEventListener('click', () => {
          setEndingSuggestionVisible(false);
        });
      }

      if (endingAcceptButton) {
        endingAcceptButton.addEventListener('click', () => {
          setEndingSuggestionVisible(false);
        });
      }

      if (endStoryButton) {
        endStoryButton.addEventListener('click', () => {
          openManuscriptEndStoryModal(endStoryButton);
        });
      }

      if (endStoryCancel) {
        endStoryCancel.addEventListener('click', closeManuscriptEndStoryModal);
      }

      if (endStoryBackdrop) {
        endStoryBackdrop.addEventListener('click', closeManuscriptEndStoryModal);
      }

      if (endStoryConfirm) {
        endStoryConfirm.addEventListener('click', () => {
          closeManuscriptEndStoryModal();
          setEndingSuggestionVisible(false);
        });
      }

      input.addEventListener('input', () => {
        if (!(activeSuggestedActionButton instanceof HTMLElement)) {
          updateCount();
          return;
        }

        const selectedSuggestion = activeSuggestedActionButton.getAttribute('data-suggested-action');
        if (input.value !== selectedSuggestion) {
          setActiveSuggestedActionButton(null);
        }

        updateCount();
      });

      setActiveSuggestedActionButton(null);
      syncSuggestedActionsForViewport();
      setEndingSuggestionVisible(false);
      updateCount();
    }

    function initPanelsController() {
      const menu = document.getElementById('manuscript-panels-menu');
      const headerToggle = document.getElementById('manuscript-panels-toggle');
      const railToggle = document.getElementById('manuscript-panels-toggle-rail');

      if (!menu || !headerToggle) {
        return;
      }

      const setOpen = (isOpen) => {
        menu.hidden = !isOpen;
        headerToggle.setAttribute('aria-expanded', String(isOpen));
        if (railToggle) {
          railToggle.setAttribute('aria-expanded', String(isOpen));
        }
      };

      const handleToggle = () => {
        const shouldOpen = menu.hidden;
        if (shouldOpen) {
          closeManuscriptHudPanels();
        }
        setOpen(shouldOpen);
      };

      headerToggle.addEventListener('click', handleToggle);
      if (railToggle) {
        railToggle.addEventListener('click', handleToggle);
      }

      menu.addEventListener('click', (event) => {
        const target = event.target instanceof Element
          ? event.target.closest('[data-drawer-trigger], #manuscript-open-journal-route, [data-manuscript-control]')
          : null;
        if (target) {
          setOpen(false);
        }
      });

      document.addEventListener('click', (event) => {
        if (menu.hidden) {
          return;
        }

        const target = event.target;
        if (!(target instanceof Node)) {
          return;
        }

        const clickedToggle = target === headerToggle || target === railToggle
          || (target instanceof Element
            && ((headerToggle.contains(target)) || (railToggle ? railToggle.contains(target) : false)));

        if (clickedToggle || menu.contains(target)) {
          return;
        }

        setOpen(false);
      });
    }

    function initHudControllers() {
      manuscriptHudPairs.forEach(({ buttonId, panelId }) => {
        const button = document.getElementById(buttonId);
        const panel = document.getElementById(panelId);

        if (!button || !panel) {
          return;
        }

        button.addEventListener('click', () => {
          const isOpen = button.getAttribute('aria-expanded') === 'true';
          const nextState = !isOpen;
          if (nextState) {
            closeManuscriptPanelsMenu();
            closeManuscriptHudPanels(buttonId);
          }
          button.setAttribute('aria-expanded', String(nextState));
          panel.hidden = !nextState;
        });
      });
    }

    function closeManuscriptDrawer() {
      const overlay = document.getElementById('manuscript-drawer-overlay');
      if (!overlay || overlay.classList.contains('hidden')) {
        return;
      }

      overlay.classList.add('hidden');
      overlay.setAttribute('aria-hidden', 'true');

      if (activeDrawerTrigger) {
        activeDrawerTrigger.focus();
        activeDrawerTrigger = null;
      }
    }

    function closeManuscriptEndStoryModal() {
      const modal = document.getElementById('manuscript-end-story-modal');
      if (!modal || modal.classList.contains('hidden')) {
        return;
      }

      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden', 'true');

      if (activeEndStoryTrigger) {
        activeEndStoryTrigger.focus();
        activeEndStoryTrigger = null;
      }
    }

    function getFocusableElements(container) {
      if (!(container instanceof HTMLElement)) {
        return [];
      }

      const focusableSelector = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled]):not([type="hidden"])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(',');

      return Array.from(container.querySelectorAll(focusableSelector))
        .filter((node) => node instanceof HTMLElement && !node.hasAttribute('hidden') && node.getAttribute('aria-hidden') !== 'true');
    }

    function trapFocusInContainer(event, container) {
      if (event.key !== 'Tab') {
        return;
      }

      const focusableElements = getFocusableElements(container);
      if (focusableElements.length === 0) {
        event.preventDefault();
        container.focus();
        return;
      }

      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey) {
        if (activeElement === firstFocusable || !container.contains(activeElement)) {
          event.preventDefault();
          lastFocusable.focus();
        }
        return;
      }

      if (activeElement === lastFocusable || !container.contains(activeElement)) {
        event.preventDefault();
        firstFocusable.focus();
      }
    }

    function initDrawerControllers() {
      const overlay = document.getElementById('manuscript-drawer-overlay');
      const panel = document.getElementById('manuscript-drawer-panel');
      const title = document.getElementById('manuscript-drawer-title');
      const subtitle = document.getElementById('manuscript-drawer-subtitle');
      const content = document.getElementById('manuscript-drawer-content');
      const closeButton = document.getElementById('manuscript-drawer-close');
      const backdrop = overlay ? overlay.querySelector('[data-drawer-backdrop]') : null;
      const triggers = document.querySelectorAll('[data-drawer-trigger]');

      if (!overlay || !panel || !title || !subtitle || !content || !closeButton || !backdrop) {
        return;
      }

      const sessionNarrativeSegments = manuscriptSourceRecords.narrativeSegments.filter(
        (segment) => segment.sessionId === manuscriptSourceRecords.session.id,
      );
      const sessionJournalEntries = manuscriptSourceRecords.journalEntries.filter(
        (entry) => entry.sessionId === manuscriptSourceRecords.session.id,
      );
      const sessionDecisions = manuscriptSourceRecords.decisions.filter(
        (decision) => decision.narrativeSegmentId
          && sessionNarrativeSegments.some((segment) => segment.id === decision.narrativeSegmentId),
      );
      const characterInventoryItems = manuscriptSourceRecords.inventoryItems.filter(
        (item) => item.characterId === manuscriptSourceRecords.character.id,
      );

      const inventoryMarkup = characterInventoryItems.length > 0
        ? characterInventoryItems.map((item) => {
          const quantityLabel = item.quantity > 1
            ? `<span class="ml-1 font-system text-xs" style="color: var(--color-text-muted);">x${item.quantity}</span>`
            : '';
          const isUsable = item.quantity > 0;
          const useActionText = `Use ${item.name}`;
          const imageMarkup = item.imageUrl
            ? `<img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.name)} item image" class="h-12 w-12 rounded-sm object-cover" style="border: 1px solid var(--color-border);" />`
            : '';

          return `<article class="rounded-sm p-3" style="background: var(--color-surface-hover); border: 1px solid var(--color-border);">
            <div class="flex items-start gap-3">
              ${imageMarkup}
              <div class="min-w-0">
                <p class="text-sm"><strong style="color: var(--color-text-primary);">${escapeHtml(item.name)}</strong>${quantityLabel}</p>
                <p class="text-xs sm:text-sm mt-1" style="color: var(--color-text-secondary);">${escapeHtml(item.description)}</p>
                <div class="mt-2 flex items-center gap-2">
                  <button type="button" data-manuscript-use-item="${escapeHtml(useActionText)}" ${isUsable ? '' : 'disabled'} class="px-2.5 py-1 rounded-sm font-interface text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" style="background: var(--color-surface); border: 1px solid var(--color-border); color: var(--color-text-primary);">
                    ${isUsable ? 'Use' : 'Unavailable'}
                  </button>
                </div>
              </div>
            </div>
          </article>`;
        }).join('')
        : '<p style="color: var(--color-text-secondary);">No inventory records found for this character.</p>';

      const storySummaryMarkup = sessionNarrativeSegments.length > 0
        ? sessionNarrativeSegments.map(
          (segment) => `<p>${escapeHtml(segment.content)}</p>`,
        ).join('')
        : '<p style="color: var(--color-text-secondary);">No narrative segments found for this session.</p>';

      const choiceHistoryMarkup = sessionDecisions.length > 0
        ? sessionDecisions.map((decision) => {
          const selectedOption = decision.options.find((option) => option.id === decision.selectedOptionId);
          const outcomeSegment = sessionNarrativeSegments.find(
            (segment) => segment.metadata && segment.metadata.causedByDecisionId === decision.id,
          );
          const outcomeText = outcomeSegment?.content || 'No outcome segment linked yet.';

          return `<article class="rounded-sm p-3" style="background: var(--color-surface-hover); border: 1px solid var(--color-border);">
            <p class="text-sm"><strong style="color: var(--color-text-primary);">Prompt:</strong> ${escapeHtml(decision.prompt)}</p>
            <p class="text-sm mt-1"><strong style="color: var(--color-text-primary);">Selected:</strong> ${escapeHtml(selectedOption?.text || decision.selectedOptionId || 'Unknown option')}</p>
            <p class="text-xs sm:text-sm mt-1" style="color: var(--color-text-secondary);"><strong style="color: var(--color-text-primary);">Outcome:</strong> ${escapeHtml(outcomeText)}</p>
          </article>`;
        }).join('')
        : '<p style="color: var(--color-text-secondary);">No recorded choices found for this session.</p>';

      const journalSnapshotMarkup = sessionJournalEntries.length > 0
        ? sessionJournalEntries.map((entry) => `<article class="rounded-sm p-3" style="background: var(--color-surface-hover); border: 1px solid var(--color-border);">
            <p class="text-sm"><strong style="color: var(--color-text-primary);">${escapeHtml(entry.title)}</strong></p>
            <p class="text-xs sm:text-sm mt-1" style="color: var(--color-text-secondary);">${escapeHtml(entry.content)}</p>
          </article>`).join('')
        : '<p style="color: var(--color-text-secondary);">No journal entries found for this session.</p>';

      const drawerContentByPanel = {
        character: {
          title: 'Character Details',
          subtitle: `Character ID: ${manuscriptSourceRecords.character.id}`,
          body: `<p><strong style="color: var(--color-text-primary);">Name:</strong> ${escapeHtml(manuscriptSourceRecords.character.name)}</p>
            <p><strong style="color: var(--color-text-primary);">Description:</strong> ${escapeHtml(manuscriptSourceRecords.character.description)}</p>
            <p><strong style="color: var(--color-text-primary);">History:</strong> ${escapeHtml(manuscriptSourceRecords.character.backgroundHistory)}</p>
            <p><strong style="color: var(--color-text-primary);">Location:</strong> ${escapeHtml(manuscriptSourceRecords.character.location)}</p>`,
        },
        inventory: {
          title: 'Inventory',
          subtitle: `Character ID: ${manuscriptSourceRecords.character.id}`,
          body: inventoryMarkup,
        },
        'story-summary': {
          title: 'The Story So Far',
          subtitle: `Session ID: ${manuscriptSourceRecords.session.id}`,
          body: storySummaryMarkup,
        },
        'choice-history': {
          title: 'Choice History',
          subtitle: `Session ID: ${manuscriptSourceRecords.session.id}`,
          body: choiceHistoryMarkup,
        },
        journal: {
          title: 'Journal Snapshot',
          subtitle: `Session ID: ${manuscriptSourceRecords.session.id}`,
          body: journalSnapshotMarkup,
        },
      };

      const openDrawer = (panelKey, trigger) => {
        const drawerData = drawerContentByPanel[panelKey] || drawerContentByPanel.character;
        title.textContent = drawerData.title;
        subtitle.textContent = drawerData.subtitle;
        content.innerHTML = drawerData.body;
        overlay.classList.remove('hidden');
        overlay.setAttribute('aria-hidden', 'false');
        const headerPanelsToggle = document.getElementById('manuscript-panels-toggle');
        const shouldReturnToPanelsToggle = trigger instanceof Element && trigger.closest('#manuscript-panels-menu');
        activeDrawerTrigger = shouldReturnToPanelsToggle ? headerPanelsToggle : (trigger || null);
        const focusableElements = getFocusableElements(panel);
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
          return;
        }
        panel.focus();
      };
      triggers.forEach((trigger) => {
        trigger.addEventListener('click', () => {
          openDrawer(trigger.getAttribute('data-drawer-panel'), trigger);
        });

        trigger.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openDrawer(trigger.getAttribute('data-drawer-panel'), trigger);
          }
        });
      });

      closeButton.addEventListener('click', closeManuscriptDrawer);
      backdrop.addEventListener('click', closeManuscriptDrawer);
      panel.addEventListener('keydown', (event) => {
        trapFocusInContainer(event, panel);
      });
    }

    document.addEventListener('DOMContentLoaded', function() {
      renderManuscriptHudFromSourceRecords();
      renderManuscriptNarrativeFromSourceRecords();
      renderManuscriptChoiceActionsFromSourceRecords();
      initManuscriptOverlayController();
      initPanelsController();
      initManuscriptInputController();
      initHudControllers();
      initDrawerControllers();
    });

    // Close nav when clicking outside
    document.addEventListener('click', function(event) {
      const nav = document.querySelector('.sticky-nav');
      const dropdown = document.getElementById('nav-dropdown');
      if (!nav.contains(event.target) && dropdown.classList.contains('open')) {
        closeNav();
      }
    });

    // Close nav on escape key
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape') {
        closeManuscriptOverlay();
        closeNav();
        closeManuscriptDrawer();
        closeManuscriptEndStoryModal();
      }
    });
