// Der Knopf unten links schaltet das Vollbild an und aus.
// Am Handy wird das Spiel im Vollbild ins Querformat gedreht.
// Wo der Browser kein Vollbild kann (zum Beispiel am iPhone), bleibt der Knopf weg.
// Hält man das Handy hochkant, erscheint ein Hinweis (siehe index.html).

function istVollbild() {
  return Boolean(document.fullscreenElement || document.webkitFullscreenElement);
}

async function vollbildAn() {
  const seite = document.documentElement;
  const anfragen = seite.requestFullscreen ?? seite.webkitRequestFullscreen;
  await anfragen.call(seite);
  // Querformat festhalten. Am Computer geht das nicht, das ist in Ordnung.
  try {
    await screen.orientation?.lock?.('landscape');
  } catch {
    // nichts zu tun
  }
}

function vollbildAus() {
  const beenden = document.exitFullscreen ?? document.webkitExitFullscreen;
  beenden.call(document);
}

export function vollbildKnopfEinrichten() {
  const knopf = document.getElementById('vollbild');
  if (!knopf) return;
  if (!(document.fullscreenEnabled || document.webkitFullscreenEnabled)) {
    knopf.hidden = true;
    return;
  }

  knopf.addEventListener('click', () => {
    if (istVollbild()) vollbildAus();
    else vollbildAn().catch(() => {});
  });

  const anzeigen = () => {
    const an = istVollbild();
    knopf.classList.toggle('an', an);
    knopf.title = an ? 'Vollbild beenden' : 'Vollbild';
    knopf.setAttribute('aria-label', knopf.title);
  };
  document.addEventListener('fullscreenchange', anzeigen);
  document.addEventListener('webkitfullscreenchange', anzeigen);
  anzeigen();
}
