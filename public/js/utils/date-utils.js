export const formatDate = (dateString) => {
  if (!dateString) return "";
  // Ensure ISO compatibility by replacing the space with 'T'
  const date = new Date(dateString.replace(' ', 'T'));

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};