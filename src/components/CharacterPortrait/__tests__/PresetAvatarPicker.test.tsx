import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PresetAvatarPicker } from '../PresetAvatarPicker';
import { PRESET_AVATARS } from '@/lib/portraits/presetAvatars';

describe('PresetAvatarPicker', () => {
  it('renders every avatar as a labelled button', () => {
    render(<PresetAvatarPicker onPreview={jest.fn()} />);

    expect(
      screen.getAllByRole('button', { name: /avatar$/i }).length
    ).toBe(PRESET_AVATARS.length);
  });

  it('narrows the grid with the search field', async () => {
    const user = userEvent.setup();
    render(<PresetAvatarPicker onPreview={jest.fn()} />);

    await user.type(screen.getByLabelText(/search avatars/i), 'zzzznotathing');

    expect(screen.getByText(/no avatars match/i)).toBeInTheDocument();
  });

  it('previews an avatar as a preset portrait when picked', async () => {
    const user = userEvent.setup();
    const onPreview = jest.fn();
    render(<PresetAvatarPicker onPreview={onPreview} />);

    const first = PRESET_AVATARS[0];
    await user.click(screen.getByRole('button', { name: `${first.name} avatar` }));

    expect(onPreview).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'preset', url: first.url })
    );
  });

  it('marks the currently selected avatar as pressed', () => {
    const first = PRESET_AVATARS[0];
    render(<PresetAvatarPicker onPreview={jest.fn()} selectedUrl={first.url} />);

    expect(
      screen.getByRole('button', { name: `${first.name} avatar` })
    ).toHaveAttribute('aria-pressed', 'true');
  });
});
