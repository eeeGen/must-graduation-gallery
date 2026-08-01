const state = { photos: [], rendered: 0, selected: new Set(), current: 0 };
const $ = (id) => document.getElementById(id);
const gallery = $('gallery'), template = $('card-template'), lightbox = $('lightbox');
const pageSize = 16;

function updateControls() {
  const count = state.selected.size;
  $('photo-count').textContent = `${state.photos.length} 张毕业照片${count ? ` · 已选 ${count} 张` : ''}`;
  $('clear-selection').disabled = !count;
  $('download-selected').disabled = !count;
}
function renderMore() {
  const items = state.photos.slice(state.rendered, state.rendered + pageSize);
  items.forEach((photo, index) => {
    const node = template.content.firstElementChild.cloneNode(true);
    const img = node.querySelector('img'), box = node.querySelector('input'), button = node.querySelector('.photo-button');
    img.src = photo.thumb; img.alt = photo.name;
    box.checked = state.selected.has(photo.name);
    box.addEventListener('change', () => { box.checked ? state.selected.add(photo.name) : state.selected.delete(photo.name); updateControls(); });
    button.addEventListener('click', () => openLightbox(state.rendered + index));
    const download = node.querySelector('.card-download'); download.href = photo.download; download.download = photo.name;
    gallery.append(node);
  });
  state.rendered += items.length;
}
function openLightbox(index) { state.current = index; const photo = state.photos[index]; $('lightbox-image').src = photo.src; $('lightbox-image').alt = photo.name; $('lightbox-caption').textContent = `${index + 1} / ${state.photos.length} · ${photo.name}`; const link = $('download-single'); link.href = photo.download; link.download = photo.name; lightbox.showModal(); }
function move(step) { openLightbox((state.current + step + state.photos.length) % state.photos.length); }
function downloadSelected() {
  const selectedPhotos = state.photos.filter((p) => state.selected.has(p.name));
  if (!selectedPhotos.length) return;
  const button = $('download-selected');
  button.disabled = true;
  button.textContent = '准备下载…';
  selectedPhotos.forEach((photo, index) => {
    window.setTimeout(() => {
      triggerDownload(photo.download, photo.name);
      if (index === selectedPhotos.length - 1) {
        window.setTimeout(() => {
          button.disabled = false;
          button.textContent = '下载选中项';
        }, 600);
      }
    }, index * 450);
  });
}
function triggerDownload(href, filename) {
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  link.rel = 'noopener';
  document.body.append(link);
  link.click();
  link.remove();
}
$('select-all').addEventListener('click', () => { state.photos.forEach((p) => state.selected.add(p.name)); document.querySelectorAll('.photo-select').forEach((x) => x.checked = true); updateControls(); });
$('clear-selection').addEventListener('click', () => { state.selected.clear(); document.querySelectorAll('.photo-select').forEach((x) => x.checked = false); updateControls(); });
$('download-selected').addEventListener('click', downloadSelected);
$('close-lightbox').addEventListener('click', () => lightbox.close()); $('previous').addEventListener('click', () => move(-1)); $('next').addEventListener('click', () => move(1));
document.addEventListener('keydown', (e) => { if (!lightbox.open) return; if (e.key === 'ArrowLeft') move(-1); if (e.key === 'ArrowRight') move(1); if (e.key === 'Escape') lightbox.close(); });
new IntersectionObserver((entries) => { if (entries[0].isIntersecting && state.rendered < state.photos.length) renderMore(); }, { rootMargin: '600px' }).observe($('sentinel'));
fetch('assets/photos.json').then((r) => r.json()).then((photos) => { state.photos = photos; renderMore(); updateControls(); }).catch(() => { $('photo-count').textContent = '照片清单载入失败'; });
