const modal = document.getElementById('reviewModal');

function openModal() { modal.classList.add('active'); }
function closeModal() { modal.classList.remove('active'); }

window.addEventListener('click', e => { if (e.target === modal) closeModal(); });

document.querySelectorAll('.tag').forEach(tag => {
  tag.addEventListener('click', () => tag.classList.toggle('active'));
});

document.querySelectorAll('.star-option').forEach(opt => {
  opt.addEventListener('click', () => {
    document.querySelectorAll('.star-option').forEach(o => o.classList.remove('active'));
    opt.classList.add('active');
  });
});