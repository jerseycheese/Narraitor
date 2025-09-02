'use client';

import React, { useState, useEffect } from 'react';
import { PersonalizationEngine } from '@/lib/ai/personalizationEngine';
import { PlayerDecisionTracker } from '@/lib/ai/playerDecisionTracker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChoiceTypePreference } from '@/types/personalization.types';

// Sample data for testing
const sampleCharacter = {
  id: 'char-test-1',
  name: 'Alex Archer',
  background: 'Experienced archaeologist with a mysterious past and keen investigative skills',
  attributes: { Intelligence: 8, Dexterity: 6, Charisma: 7, Strength: 5 },
  skills: [
    { name: 'Investigation', level: 8, worldSkillId: 'skill-1' },
    { name: 'Athletics', level: 5, worldSkillId: 'skill-2' },
    { name: 'Persuasion', level: 7, worldSkillId: 'skill-3' },
    { name: 'Stealth', level: 4, worldSkillId: 'skill-4' }
  ],
  createdAt: '2023-01-01',
  updatedAt: '2023-01-01'
};

const sampleWorld = {
  id: 'world-test-1',
  name: 'Ancient Mysteries',
  description: 'A world of archaeological discoveries, hidden temples, and ancient secrets waiting to be uncovered',
  genre: 'mystery' as const,
  createdAt: '2023-01-01',
  updatedAt: '2023-01-01',
  attributes: [],
  skills: [],
  settings: {
    maxAttributes: 6,
    maxSkills: 8,
    attributePointPool: 27,
    skillPointPool: 40
  }
};

const choiceTypes: ChoiceTypePreference[] = [
  'diplomatic', 'aggressive', 'stealthy', 'helpful',
  'selfish', 'lawful', 'chaotic', 'neutral'
];

const sampleScenarios = [
  {
    prompt: "You encounter a locked door blocking your path. What do you do?",
    choices: [
      { text: "Pick the lock quietly", type: 'stealthy' as ChoiceTypePreference },
      { text: "Break down the door", type: 'aggressive' as ChoiceTypePreference },
      { text: "Look for another way around", type: 'neutral' as ChoiceTypePreference },
      { text: "Ask the guard for permission", type: 'lawful' as ChoiceTypePreference }
    ]
  },
  {
    prompt: "A stranger approaches asking for help finding their lost pet. What do you do?",
    choices: [
      { text: "Immediately offer to help search", type: 'helpful' as ChoiceTypePreference },
      { text: "Politely decline and continue on", type: 'selfish' as ChoiceTypePreference },
      { text: "Ask questions to verify their story first", type: 'neutral' as ChoiceTypePreference },
      { text: "Suggest they contact local authorities", type: 'lawful' as ChoiceTypePreference }
    ]
  },
  {
    prompt: "You overhear guards discussing a secret meeting. What do you do?",
    choices: [
      { text: "Sneak closer to listen", type: 'stealthy' as ChoiceTypePreference },
      { text: "Confront them directly", type: 'aggressive' as ChoiceTypePreference },
      { text: "Try to befriend them to learn more", type: 'diplomatic' as ChoiceTypePreference },
      { text: "Report it to their superior", type: 'lawful' as ChoiceTypePreference }
    ]
  },
  {
    prompt: "A merchant is overcharging tourists for basic supplies. What do you do?",
    choices: [
      { text: "Negotiate a fair price for everyone", type: 'diplomatic' as ChoiceTypePreference },
      { text: "Threaten to report them", type: 'aggressive' as ChoiceTypePreference },
      { text: "Quietly warn the tourists", type: 'helpful' as ChoiceTypePreference },
      { text: "Mind your own business", type: 'selfish' as ChoiceTypePreference }
    ]
  },
  {
    prompt: "You discover someone has been going through your belongings. What do you do?",
    choices: [
      { text: "Confront them immediately", type: 'aggressive' as ChoiceTypePreference },
      { text: "Set a trap to catch them", type: 'stealthy' as ChoiceTypePreference },
      { text: "Talk to them calmly about it", type: 'diplomatic' as ChoiceTypePreference },
      { text: "Ignore it and secure your things better", type: 'neutral' as ChoiceTypePreference }
    ]
  },
  {
    prompt: "A group is planning something that seems chaotic but fun. What do you do?",
    choices: [
      { text: "Join in enthusiastically", type: 'chaotic' as ChoiceTypePreference },
      { text: "Suggest they follow proper procedures", type: 'lawful' as ChoiceTypePreference },
      { text: "Offer to help them organize it better", type: 'helpful' as ChoiceTypePreference },
      { text: "Watch from a distance", type: 'neutral' as ChoiceTypePreference }
    ]
  }
];

export default function PersonalizationTestPage() {
  const [engine] = useState(() => new PersonalizationEngine());
  const [tracker] = useState(() => new PlayerDecisionTracker({ 
    storageKey: 'test_personalization_harness'
  }));
  
  const [decisions, setDecisions] = useState(tracker.getAllDecisions());
  const [currentScenario, setCurrentScenario] = useState(0);
  const [customPrompt, setCustomPrompt] = useState('');
  const [customChoice, setCustomChoice] = useState('');
  const [customChoiceType, setCustomChoiceType] = useState<ChoiceTypePreference>('neutral');
  
  // Analysis results
  const [analysis, setAnalysis] = useState<ReturnType<PersonalizationEngine['analyzePlayerBehavior']> | null>(null);
  const [patterns, setPatterns] = useState<ReturnType<PlayerDecisionTracker['analyzeChoicePatterns']> | null>(null);
  const [enhancement, setEnhancement] = useState('');
  const [sampleNarrative, setSampleNarrative] = useState('');
  const [baselineNarrative, setBaselineNarrative] = useState('');
  const [isGeneratingNarrative, setIsGeneratingNarrative] = useState(false);
  const [isGeneratingBaseline, setIsGeneratingBaseline] = useState(false);

  const updateAnalysis = React.useCallback(() => {
    const currentDecisions = tracker.getAllDecisions();
    setDecisions(currentDecisions);
    
    if (currentDecisions.length > 0) {
      const behaviorAnalysis = engine.analyzePlayerBehavior(
        sampleCharacter,
        sampleWorld,
        currentDecisions
      );
      setAnalysis(behaviorAnalysis);
      
      const choicePatterns = tracker.analyzeChoicePatterns();
      setPatterns(choicePatterns);
      
      const personalizedContext = engine.createPersonalizedContext(
        sampleCharacter,
        sampleWorld,
        currentDecisions
      );
      
      const narrativeEnhancement = engine.generateNarrativeEnhancement(personalizedContext);
      setEnhancement(narrativeEnhancement);
    } else {
      setAnalysis(null);
      setPatterns(null);
      setEnhancement('');
    }
  }, [engine, tracker]);

  useEffect(() => {
    updateAnalysis();
  }, [updateAnalysis]);

  const recordDecision = (prompt: string, choiceText: string, choiceType: ChoiceTypePreference, context?: Record<string, unknown>) => {
    tracker.recordDecision(
      prompt,
      choiceText,
      choiceType,
      'test-session-1',
      'world-test-1',
      context
    );
    updateAnalysis();
  };

  const handleScenarioChoice = (choice: { text: string; type: ChoiceTypePreference }) => {
    const scenario = sampleScenarios[currentScenario];
    recordDecision(scenario.prompt, choice.text, choice.type, {
      location: 'Test Environment',
      situation: `Scenario ${currentScenario + 1}`,
      charactersPresent: ['Test NPC']
    });
    
    // Move to next scenario
    setCurrentScenario((prev) => (prev + 1) % sampleScenarios.length);
  };

  const handleCustomDecision = () => {
    if (customPrompt.trim() && customChoice.trim()) {
      recordDecision(customPrompt, customChoice, customChoiceType);
      setCustomPrompt('');
      setCustomChoice('');
      setCustomChoiceType('neutral');
    }
  };

  const clearDecisions = () => {
    tracker.clearDecisions();
    updateAnalysis();
    setSampleNarrative('');
    setBaselineNarrative('');
  };

  const generateSampleNarrative = async () => {
    if (!enhancement) return;
    
    setIsGeneratingNarrative(true);
    
    try {
      // Create a sample scenario prompt that would be enhanced with personalization
      const basePrompt = `You are exploring an ancient temple. The air is thick with dust and mystery. Ahead, you see two paths: one leads deeper into darkness, while the other shows faint light filtering through cracks in the stone walls. What do you do?`;
      
      const personalizedPrompt = `${basePrompt}

PERSONALIZATION CONTEXT:
${enhancement}

Generate a narrative response (2-3 paragraphs) that adapts to the player's established personality and preferences. The narrative should reflect their decision-making style and preferred approaches to problem-solving.

IMPORTANT: If the player shows aggressive/direct tendencies, the character should be bold, decisive, and willing to take risks. If they show careful/stealthy tendencies, emphasize caution and observation. Match the narrative voice and decision-making to the detected personality traits.`;

      const response = await fetch('/api/narrative/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: personalizedPrompt,
          maxTokens: 300
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      setSampleNarrative(data.content || 'No narrative generated');
    } catch (error) {
      console.error('Error generating narrative:', error);
      setSampleNarrative('Error generating narrative. This demonstrates how the personalization would work with a live AI connection.');
    } finally {
      setIsGeneratingNarrative(false);
    }
  };

  const generateBaselineNarrative = async () => {
    setIsGeneratingBaseline(true);
    
    try {
      const basePrompt = `You are exploring an ancient temple. The air is thick with dust and mystery. Ahead, you see two paths: one leads deeper into darkness, while the other shows faint light filtering through cracks in the stone walls. What do you do?

Generate a narrative response (2-3 paragraphs) describing the scene and potential choices.`;

      const response = await fetch('/api/narrative/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: basePrompt,
          maxTokens: 300
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      setBaselineNarrative(data.content || 'No narrative generated');
    } catch (error) {
      console.error('Error generating baseline narrative:', error);
      setBaselineNarrative('Error generating narrative. This demonstrates the comparison between personalized and standard narrative generation.');
    } finally {
      setIsGeneratingBaseline(false);
    }
  };

  const getStyleBadgeColor = (style: string) => {
    switch (style) {
      case 'action-focused': return 'bg-red-100 text-red-700';
      case 'character-driven': return 'bg-blue-100 text-blue-900';
      case 'strategic': return 'bg-blue-100 text-blue-900';
      case 'dialogue-heavy': return 'bg-green-100 text-green-700';
      case 'exploration': return 'bg-amber-100 text-amber-700';
      default: return 'bg-gray-100 text-gray-900';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Personalization System Test Harness</h1>
        <p className="text-muted-foreground mt-2">
          Interactive testing environment for the AI-driven narrative personalization system
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Decision Recording Section */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Scenario Testing</CardTitle>
              <CardDescription>
                Test with pre-built scenarios to see different choice patterns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">
                  Scenario {currentScenario + 1} of {sampleScenarios.length}
                </h3>
                <p className="text-sm mb-3">{sampleScenarios[currentScenario].prompt}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {sampleScenarios[currentScenario].choices.map((choice, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      onClick={() => handleScenarioChoice(choice)}
                      className="text-left h-auto p-2 whitespace-normal"
                    >
                      <div>
                        <div className="font-medium">{choice.text}</div>
                        <Badge variant="secondary" className="mt-1">
                          {choice.type}
                        </Badge>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Custom Decision Recording</CardTitle>
              <CardDescription>
                Record custom decisions to test specific scenarios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="prompt">Decision Prompt</Label>
                <Textarea
                  id="prompt"
                  placeholder="Describe the situation the player faces..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="choice">Player Choice</Label>
                <Input
                  id="choice"
                  placeholder="What the player chose to do..."
                  value={customChoice}
                  onChange={(e) => setCustomChoice(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="choiceType">Choice Type</Label>
                <Select 
                  id="choiceType"
                  value={customChoiceType} 
                  onChange={(e) => setCustomChoiceType(e.target.value as ChoiceTypePreference)}
                >
                  {choiceTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </Select>
              </div>
              <Button onClick={handleCustomDecision} className="w-full">
                Record Decision
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Decision History</CardTitle>
              <CardDescription>
                Recent decisions ({decisions.length} total)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {decisions.slice(-5).reverse().map((decision) => (
                  <div key={decision.id} className="p-3 bg-muted rounded text-sm">
                    <div className="font-medium">{decision.choiceText}</div>
                    <div className="text-muted-foreground mt-1">
                      <Badge variant="outline" className="mr-2">
                        {decision.choiceType}
                      </Badge>
                      {decision.prompt}
                    </div>
                  </div>
                ))}
              </div>
              <hr className="my-4" />
              <Button variant="destructive" onClick={clearDecisions} className="w-full">
                Clear All Decisions
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Analysis Results Section */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Behavioral Analysis</CardTitle>
              <CardDescription>
                AI-detected personality traits and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analysis ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Detected Personality Traits</h4>
                    <div className="flex flex-wrap gap-1">
                      {analysis.detectedTraits.map((trait: string) => (
                        <Badge key={trait} variant="default">
                          {trait}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Narrative Style</h4>
                    <Badge className={getStyleBadgeColor(analysis.preferences.narrativeStyle)}>
                      {analysis.preferences.narrativeStyle}
                    </Badge>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Preferred Choice Types</h4>
                    <div className="flex flex-wrap gap-1">
                      {analysis.preferences.preferredChoiceTypes.map((type: string) => (
                        <Badge key={type} variant="outline">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Preferences</h4>
                    <div className="text-sm space-y-1">
                      <div>Detail Level: <strong>{analysis.preferences.detailLevel}</strong></div>
                      <div>Content Focus: <strong>{analysis.preferences.contentFocus}</strong></div>
                      <div>Confidence: <strong>{analysis.preferences.confidenceLevel}%</strong></div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Record some decisions to see behavioral analysis results.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Choice Pattern Analysis</CardTitle>
              <CardDescription>
                Statistical analysis of decision patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              {patterns ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Pattern Strength</h4>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${patterns.patternStrength}%` }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {patterns.patternStrength}% - {patterns.patternStrength > 70 ? 'Very Strong' : patterns.patternStrength > 50 ? 'Strong' : patterns.patternStrength > 30 ? 'Moderate' : 'Weak'} Pattern
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Choice Distribution</h4>
                    <div className="space-y-1">
                      {Object.entries(patterns.choiceDistribution).map(([type, count]) => (
                        <div key={type} className="flex justify-between text-sm">
                          <span>{type}</span>
                          <span>{count as number}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Dominant Choice Types</h4>
                    <div className="flex flex-wrap gap-1">
                      {patterns.dominantChoiceTypes.slice(0, 3).map((type: string, idx: number) => (
                        <Badge key={type} variant={idx === 0 ? "default" : "outline"}>
                          #{idx + 1} {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Record some decisions to see pattern analysis.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Narrative Enhancement Preview</CardTitle>
              <CardDescription>
                Generated enhancement text for AI narrative generation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {enhancement ? (
                <div className="p-4 bg-muted rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm font-mono">
                    {enhancement}
                  </pre>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Record some decisions to see narrative enhancement.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Personalized Narrative Demo</CardTitle>
              <CardDescription>
                Compare how personalization affects actual AI narrative generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Sample Scenario</h4>
                <p className="text-blue-900 text-sm">
                  &ldquo;You are exploring an ancient temple. The air is thick with dust and mystery. 
                  Ahead, you see two paths: one leads deeper into darkness, while the other shows 
                  faint light filtering through cracks in the stone walls. What do you do?&rdquo;
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Button 
                    onClick={generateBaselineNarrative}
                    disabled={isGeneratingBaseline}
                    variant="outline"
                    className="w-full"
                  >
                    {isGeneratingBaseline ? 'Generating...' : 'Generate Standard Narrative'}
                  </Button>
                  
                  {baselineNarrative && (
                    <div className="p-4 bg-gray-100 rounded-lg border border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-2">🤖 Standard AI Narrative</h4>
                      <div className="text-gray-900 text-sm whitespace-pre-wrap">
                        {baselineNarrative}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <Button 
                    onClick={generateSampleNarrative}
                    disabled={isGeneratingNarrative || !enhancement}
                    className="w-full"
                  >
                    {isGeneratingNarrative ? 'Generating...' : 'Generate Personalized Narrative'}
                  </Button>
                  
                  {sampleNarrative && (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <h4 className="font-medium text-green-900 mb-2">✨ Personalized AI Narrative</h4>
                      <div className="text-green-700 text-sm whitespace-pre-wrap">
                        {sampleNarrative}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {!enhancement && (
                <div className="p-3 bg-amber-50 rounded border border-amber-500">
                  <p className="text-amber-700 text-sm">
                    📝 <strong>Record some decisions first</strong> to enable personalized narrative generation.
                  </p>
                </div>
              )}
              
              <div className="p-3 bg-amber-200 rounded border border-amber-200">
                <p className="text-amber-700 text-xs">
                  💡 <strong>How it works:</strong> Compare the two narratives to see how personalization context 
                  affects AI storytelling. The personalized version uses your detected personality traits, 
                  decision patterns, and preferences to craft a narrative that matches your play style.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Character & World Info */}
      <Card>
        <CardHeader>
          <CardTitle>Test Data</CardTitle>
          <CardDescription>
            Sample character and world used for testing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Character: {sampleCharacter.name}</h4>
              <p className="text-sm text-muted-foreground mb-2">{sampleCharacter.background}</p>
              <div className="text-sm">
                <strong>Skills:</strong> {sampleCharacter.skills.map(s => s.name).join(', ')}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">World: {sampleWorld.name}</h4>
              <p className="text-sm text-muted-foreground">{sampleWorld.description}</p>
              <div className="text-sm mt-2">
                <strong>Genre:</strong> {sampleWorld.genre}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}