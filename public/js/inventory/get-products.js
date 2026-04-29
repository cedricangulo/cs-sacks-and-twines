export async function getProducts() {
  const container = document.getElementById('products-container');
  const apiUrl = container?.getAttribute('data-api-url') || '/api/products';

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return await response.json();
  } catch (error) {
    console.error('There was a problem with the fetch operation:', error);
    throw error;
  }
}