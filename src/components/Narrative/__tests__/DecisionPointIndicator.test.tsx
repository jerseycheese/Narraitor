import React from 'react';
import { render, screen } from '@testing-library/react';
import { DecisionPointIndicator } from '../DecisionPointIndicator';

describe('DecisionPointIndicator', () => {
  it('renders with default state', () => {
    render(<DecisionPointIndicator isActive={false} />);
    
    const indicator = screen.getByTestId('decision-point-indicator');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveClass('opacity-30');
  });

  it('renders as active with proper styling', () => {
    render(<DecisionPointIndicator isActive={true} />);
    
    const indicator = screen.getByTestId('decision-point-indicator');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveClass('opacity-100');
    
    // Should have decision point text
    expect(screen.getByText('Decision Point')).toBeInTheDocument();
  });

  it('applies minor decision weight styling', () => {
    render(<DecisionPointIndicator isActive={true} decisionWeight="minor" />);
    
    const indicator = screen.getByTestId('decision-point-indicator');
    expect(indicator).toHaveClass('border-blue-300', 'bg-blue-50');
    
    const dot = screen.getByTestId('decision-weight-indicator');
    expect(dot).toHaveClass('bg-blue-500');
  });

  it('applies major decision weight styling', () => {
    render(<DecisionPointIndicator isActive={true} decisionWeight="major" />);
    
    const indicator = screen.getByTestId('decision-point-indicator');
    expect(indicator).toHaveClass('border-amber-400', 'bg-amber-50');
    
    const dot = screen.getByTestId('decision-weight-indicator');
    expect(dot).toHaveClass('bg-amber-500');
  });

  it('applies critical decision weight styling', () => {
    render(<DecisionPointIndicator isActive={true} decisionWeight="critical" />);
    
    const indicator = screen.getByTestId('decision-point-indicator');
    expect(indicator).toHaveClass('border-red-400', 'bg-red-50');
    
    const dot = screen.getByTestId('decision-weight-indicator');
    expect(dot).toHaveClass('bg-red-500');
  });

  it('supports custom className', () => {
    render(<DecisionPointIndicator isActive={true} className="custom-class" />);
    
    const indicator = screen.getByTestId('decision-point-indicator');
    expect(indicator).toHaveClass('custom-class');
  });

  it('has proper accessibility attributes when active', () => {
    render(<DecisionPointIndicator isActive={true} />);
    
    const indicator = screen.getByTestId('decision-point-indicator');
    expect(indicator).toHaveAttribute('role', 'group');
    expect(indicator).toHaveAttribute('aria-label', 'Decision point indicator');
  });

  it('includes animation pulse when active', () => {
    render(<DecisionPointIndicator isActive={true} />);
    
    const dot = screen.getByTestId('decision-weight-indicator');
    expect(dot).toHaveClass('animate-pulse');
  });

  it('shows connecting line when active', () => {
    render(<DecisionPointIndicator isActive={true} />);
    
    const connectingLine = screen.getByTestId('decision-connecting-line');
    expect(connectingLine).toBeInTheDocument();
    expect(connectingLine).toHaveClass('bg-gray-300');
  });
});