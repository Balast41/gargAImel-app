document.getElementById('btn').addEventListener('click', async () => {
  const msg = await window.api.ping();
  document.getElementById('out').textContent = msg;
});