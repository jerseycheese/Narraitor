export const getSignificanceBadgeVariant = (
  significance: string
): 'destructive-static' | 'warning-static' | 'secondary-static' => {
  switch (significance) {
    case 'critical':
      return 'destructive-static';
    case 'major':
      return 'warning-static';
    case 'minor':
    default:
      return 'secondary-static';
  }
};
