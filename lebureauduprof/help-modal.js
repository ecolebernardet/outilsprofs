// =========================================================================
// MODALE D'AIDE — Le Bureau du Prof
// =========================================================================

(function () {
  const html = `
<div id="help-modal-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.72);z-index:20010;justify-content:center;align-items:center;padding:20px;">
<div style="background:#fff;border-radius:18px;width:100%;max-width:900px;max-height:92vh;display:flex;flex-direction:column;box-shadow:0 24px 80px rgba(0,0,0,0.5);overflow:hidden;">

  <!-- EN-TÊTE -->
  <div style="background:linear-gradient(135deg,#2B7FFF 0%,#8E51FF 100%);color:white;padding:22px 28px;display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-shrink:0;">
    <div>
      <div style="font-size:1.4em;font-weight:800;">📋 Aide complète — Le Bureau du Prof</div>
      <div style="font-size:0.85em;opacity:0.85;margin-top:4px;">Cliquez sur une section dans le menu à gauche pour naviguer.</div>
    </div>
    <button onclick="closeHelpModal()" style="background:rgba(255,255,255,0.2);border:none;border-radius:50%;width:36px;height:36px;color:white;font-size:20px;cursor:pointer;flex-shrink:0;">×</button>
  </div>

  <!-- CORPS -->
  <div style="display:flex;flex:1;overflow:hidden;">

    <!-- SIDEBAR -->
    <nav id="help-sidebar" style="width:220px;flex-shrink:0;background:#f4f6f9;border-right:1px solid #e5e8ee;overflow-y:auto;padding:14px 0;">
      <div style="padding:4px 16px 6px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#999;">Vue d'ensemble</div>
      <div class="help-nav" data-s="h-intro"         onclick="helpShow(this)" style="border-left-color:#2B7FFF;background:#e8edf5;color:#2B7FFF;font-weight:700;">🏠 Introduction</div>
      <div class="help-nav" data-s="h-menu"           onclick="helpShow(this)">＋ Menu principal</div>
      <div style="height:1px;background:#e0e4ea;margin:8px 18px;"></div>
      <div style="padding:4px 16px 6px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#999;">Widgets</div>
      <div class="help-nav" data-s="h-widgets"        onclick="helpShow(this)">📦 Tous les widgets</div>
      <div class="help-nav" data-s="h-widgets-outils" onclick="helpShow(this)">🛠️ Outils pédagogiques</div>
      <div class="help-nav" data-s="h-widgets-media"  onclick="helpShow(this)">🎞️ Médias</div>
      <div style="height:1px;background:#e0e4ea;margin:8px 18px;"></div>
      <div style="padding:4px 16px 6px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#999;">Manipulation</div>
      <div class="help-nav" data-s="h-selection"    onclick="helpShow(this)">🖱️ Sélection</div>
      <div class="help-nav" data-s="h-deplacement"  onclick="helpShow(this)">✥ Déplacement &amp; Resize</div>
      <div class="help-nav" data-s="h-rotation"     onclick="helpShow(this)">↻ Rotation</div>
      <div class="help-nav" data-s="h-groupes"      onclick="helpShow(this)">⛓️ Groupes</div>
      <div style="height:1px;background:#e0e4ea;margin:8px 18px;"></div>
      <div style="padding:4px 16px 6px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#999;">Annotation</div>
      <div class="help-nav" data-s="h-texte"        onclick="helpShow(this)">🖊️ Texte &amp; Format</div>
      <div class="help-nav" data-s="h-formes"       onclick="helpShow(this)">🔲 Formes</div>
      <div class="help-nav" data-s="h-dessin"       onclick="helpShow(this)">✏️ Dessin libre &amp; Géométrie</div>
      <div class="help-nav" data-s="h-gomme"        onclick="helpShow(this)">🧽 Gomme</div>
      <div style="height:1px;background:#e0e4ea;margin:8px 18px;"></div>
      <div style="padding:4px 16px 6px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#999;">Système</div>
      <div class="help-nav" data-s="h-projets"      onclick="helpShow(this)">📁 Projets</div>
      <div class="help-nav" data-s="h-scenes"       onclick="helpShow(this)">🗂️ Tableaux (scènes)</div>
      <div class="help-nav" data-s="h-fond"         onclick="helpShow(this)">🖼️ Fond d'écran</div>
      <div class="help-nav" data-s="h-sauvegarde"   onclick="helpShow(this)">💾 Sauvegarde</div>
      <div class="help-nav" data-s="h-undoredo"     onclick="helpShow(this)">↩ Annuler / Refaire</div>
      <div class="help-nav" data-s="h-laser"        onclick="helpShow(this)">🔴 Pointeur laser</div>
      <div class="help-nav" data-s="h-avance"       onclick="helpShow(this)">⚙️ Astuces avancées</div>
    </nav>

    <!-- CONTENU -->
    <div style="flex:1;overflow-y:auto;padding:28px 32px;font-family:'Segoe UI',system-ui,sans-serif;">

      <!-- INTRODUCTION -->
      <div id="h-intro" class="help-section" style="display:block;">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">🏠 Bienvenue sur Le Bureau du Prof</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:10px;">Le Bureau du Prof est un <strong>tableau de bord interactif</strong> conçu pour les enseignants. Il permet d'afficher simultanément des widgets (heure, date, devoirs, météo, minuteur, sonomètre…), de dessiner librement, d'annoter, d'organiser son travail en projets et tableaux, et de tout sauvegarder.</p>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:14px;">Le tableau respecte un <strong>format 16:9</strong> et s'adapte automatiquement à la taille de votre écran ou vidéoprojecteur.</p>
        <div style="font-size:0.97em;font-weight:700;color:#2B7FFF;margin:18px 0 8px 0;">🗺️ Organisation de l'interface</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
          <div style="background:#f8f9fb;border:1px solid #e5e8ee;border-radius:10px;padding:14px 16px;"><div style="font-size:13px;font-weight:700;color:#222;margin-bottom:6px;">＋ Bouton menu (bas-gauche)</div><p style="font-size:12.5px;color:#444;margin:0;">Ouvre le <strong>menu principal</strong> organisé en rubriques : Contenu, Annotation, Système.</p></div>
          <div style="background:#f8f9fb;border:1px solid #e5e8ee;border-radius:10px;padding:14px 16px;"><div style="font-size:13px;font-weight:700;color:#222;margin-bottom:6px;">🖊️ Barre de texte</div><p style="font-size:12.5px;color:#444;margin:0;">Apparaît automatiquement en cliquant dans un widget Texte ou Devoirs. Police, taille, couleur, alignement…</p></div>
          <div style="background:#f8f9fb;border:1px solid #e5e8ee;border-radius:10px;padding:14px 16px;"><div style="font-size:13px;font-weight:700;color:#222;margin-bottom:6px;">📁 Projets &amp; Tableaux</div><p style="font-size:12.5px;color:#444;margin:0;">Un <strong>projet</strong> contient plusieurs <strong>tableaux</strong>. Passez de l'un à l'autre via le menu Fichier.</p></div>
          <div style="background:#f8f9fb;border:1px solid #e5e8ee;border-radius:10px;padding:14px 16px;"><div style="font-size:13px;font-weight:700;color:#222;margin-bottom:6px;">📽️ Mode présentation</div><p style="font-size:12.5px;color:#444;margin:0;">Bouton fixe en bas à droite. Masque toute l'interface pour projeter en plein écran propre.</p></div>
        </div>
        <div style="background:#eef7ff;border-left:4px solid #2B7FFF;border-radius:0 8px 8px 0;padding:10px 14px;font-size:12.5px;color:#1a4d8f;margin:10px 0;">💡 <strong>Démarrage rapide :</strong> Cliquez sur <strong>＋</strong> en bas à gauche → choisissez un widget → glissez-le par la poignée <strong>✥</strong>.</div>
        <div style="background:#1a1a2e;border-left:4px solid #8E51FF;border-radius:0 8px 8px 0;padding:10px 14px;font-size:12.5px;color:#ccc;margin:10px 0;">📽️ <strong>Mode présentation :</strong> Cliquez sur <strong>📽️</strong> en bas à droite. <strong>Échap</strong> pour revenir.</div>
      </div>

      <!-- MENU PRINCIPAL -->
      <div id="h-menu" class="help-section">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">＋ Le menu principal</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:14px;">Cliquez sur <strong>＋</strong> en bas à gauche. Les entrées avec <strong>›</strong> ouvrent un sous-menu au survol.</p>
        <div style="font-size:0.97em;font-weight:700;color:#27ae60;margin:10px 0 8px 0;">🟢 Rubrique Contenu</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Entrée</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Ce qu'elle fait</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">🛠️ <strong>Outils</strong> ›</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Tirage au sort 🎡 · Minuteur &amp; Chrono ⏱️ · Sonomètre 🔊 · Radar de Bruit 📡 · Monnaie 💶 · Calcul Mental 🧮 · Ordre Alphabétique 🔤 · OutilsProfs · Défi Calme 🧘</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">📦 <strong>Widgets</strong> ›</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Date 📅 · Heure 🕒 · Météo ⛅ · Devoirs 📝 · Planning 📌 · PDF 📄 · Fenêtre Web 💻 · YouTube 🎬</td></tr>
          <tr><td style="padding:8px 12px;">🖊️ <strong>Texte</strong></td><td style="padding:8px 12px;color:#444;">Crée directement un widget Texte et ouvre son éditeur</td></tr>
        </table>
        <div style="font-size:0.97em;font-weight:700;color:#8E51FF;margin:10px 0 8px 0;">🟣 Rubrique Annotation</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Entrée</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Ce qu'elle fait</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">😀 <strong>Stickers</strong></td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Ouvre un panneau d'emojis déposables sur le bureau</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">🔲 <strong>Formes</strong></td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Active la barre d'outils formes géométriques (rectangle, ellipse, flèche, ligne…)</td></tr>
          <tr><td style="padding:8px 12px;">✏️ <strong>Dessin</strong></td><td style="padding:8px 12px;color:#444;">Active la barre de dessin libre (stylo, épaisseur, couleur, gomme)</td></tr>
        </table>
        <div style="font-size:0.97em;font-weight:700;color:#2B7FFF;margin:10px 0 8px 0;">🔵 Rubrique Système</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Entrée</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Ce qu'elle fait</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">🖥️ <strong>Affichage</strong> ›</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Fond d'écran 🖼️ · Pointeur laser 🔴 · Mode clair ☀️</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">🗄️ <strong>Fichier</strong> ›</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Sauvegarder JSON · Charger JSON · Nouveau projet ✨ · Nouveau brouillon 📝 · Tous mes projets 📁 · Projets favoris ⭐ · Tableaux de ce projet 🗂️ · Effacer le tableau ❌</td></tr>
          <tr><td style="padding:8px 12px;">↩ ↪ ❓</td><td style="padding:8px 12px;color:#444;">Annuler · Refaire · Aide</td></tr>
        </table>
        <div style="background:#eef7ff;border-left:4px solid #2B7FFF;border-radius:0 8px 8px 0;padding:10px 14px;font-size:12.5px;color:#1a4d8f;">💡 Les sous-menus (›) s'affichent au survol. Cliquez à l'extérieur pour fermer le menu.</div>
      </div>

      <!-- TOUS LES WIDGETS -->
      <div id="h-widgets" class="help-section">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">📦 Tous les widgets</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:14px;">Chaque widget est une fenêtre flottante indépendante : déplaçable, redimensionnable, rotatif, épinglable. Accès via <strong>＋ → Contenu</strong>.</p>
        <div style="font-size:0.97em;font-weight:700;color:#2B7FFF;margin:0 0 10px 0;">⚙️ Contrôles communs à tous les widgets</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Poignée</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Position</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Action</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;font-weight:700;">✥</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Gauche (milieu)</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Déplacer par glisser-déposer</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;font-weight:700;">↻</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Droite (milieu)</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Faire pivoter — magnétisme aux angles 0°/45°/90°…</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;font-weight:700;">📌</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Barre d'action (haut)</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Épingler au premier plan (fond doré = épinglé)</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;font-weight:700;">🔽</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Barre d'action (haut)</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Envoyer derrière tous les autres widgets</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;font-weight:700;">☰</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Barre d'action (haut)</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Menu contextuel : dupliquer, fond transparent, couleur de fond, opacité…</td></tr>
          <tr><td style="padding:8px 12px;font-weight:700;color:#ff5f56;">×</td><td style="padding:8px 12px;color:#444;">Barre d'action (haut droite)</td><td style="padding:8px 12px;color:#444;">Supprimer le widget</td></tr>
        </table>
        <div style="background:#eef7ff;border-left:4px solid #2B7FFF;border-radius:0 8px 8px 0;padding:10px 14px;font-size:12.5px;color:#1a4d8f;margin-bottom:20px;">💡 <strong>Redimensionner :</strong> survolez un widget → triangle gris en bas à droite → glissez.</div>
        <div style="font-size:0.97em;font-weight:700;color:#2B7FFF;margin:0 0 10px 0;">📋 Widgets d'information</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Widget</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Description &amp; particularités</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;white-space:nowrap;"><span style="background:#2B7FFF;color:white;border-radius:5px;padding:2px 8px;font-size:11px;font-weight:700;">🖊️ Texte</span></td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Zone de saisie libre avec mise en forme riche (police, taille, couleur, gras, italique…). Barre de formatage au clic.</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;white-space:nowrap;"><span style="background:#3BB8DB;color:white;border-radius:5px;padding:2px 8px;font-size:11px;font-weight:700;">📝 Devoirs</span></td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Widget texte pré-rempli pour noter les devoirs par classe. Contenu entièrement modifiable.</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;white-space:nowrap;"><span style="background:#679638;color:white;border-radius:5px;padding:2px 8px;font-size:11px;font-weight:700;">📅 Date</span></td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Affiche jour, numéro et mois en temps réel. Police auto-adaptative à la taille du widget.</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;white-space:nowrap;"><span style="background:#7CCF35;color:white;border-radius:5px;padding:2px 8px;font-size:11px;font-weight:700;">🕒 Heure</span></td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Horloge numérique temps réel (h:min:sec). Taille de police auto, fond transparent.</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;white-space:nowrap;"><span style="background:#00AACC;color:white;border-radius:5px;padding:2px 8px;font-size:11px;font-weight:700;">⛅ Météo</span></td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Météo réelle de votre ville via Open-Meteo (gratuit). Clic sur la ville pour la changer. Rafraîchissement toutes les 10 min.</td></tr>
          <tr><td style="padding:8px 12px;white-space:nowrap;"><span style="background:#8E51FF;color:white;border-radius:5px;padding:2px 8px;font-size:11px;font-weight:700;">📌 Planning</span></td><td style="padding:8px 12px;color:#444;">Agenda journalier avec lignes horaires. Clic pour éditer. Glisser par ⋮⋮ pour réordonner. Bouton ＋ pour ajouter un créneau.</td></tr>
        </table>
      </div>

      <!-- OUTILS PÉDAGOGIQUES -->
      <div id="h-widgets-outils" class="help-section">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">🛠️ Outils pédagogiques</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:14px;">Accessibles via <strong>＋ → Contenu → Outils</strong>.</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Widget</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Description &amp; fonctionnement</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;white-space:nowrap;"><span style="background:#e67e22;color:white;border-radius:5px;padding:2px 8px;font-size:11px;font-weight:700;">⏱️ Minuteur &amp; Chrono</span></td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Minuteur décompte et chronomètre. Saisie directe de la durée. Alerte sonore à la fin.</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;white-space:nowrap;"><span style="background:#e74c3c;color:white;border-radius:5px;padding:2px 8px;font-size:11px;font-weight:700;">🔊 Sonomètre</span></td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Mesure le niveau sonore en temps réel via le microphone. Affichage en dB avec jauge colorée.</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;white-space:nowrap;"><span style="background:#c0392b;color:white;border-radius:5px;padding:2px 8px;font-size:11px;font-weight:700;">📡 Radar de Bruit</span></td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Visualisation radar du bruit ambiant. Représentation graphique circulaire animée.</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;white-space:nowrap;"><span style="background:#27ae60;color:white;border-radius:5px;padding:2px 8px;font-size:11px;font-weight:700;">🎡 Tirage au Sort</span></td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Roue ou liste pour tirer un élève ou une équipe au sort. Liste configurable.</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;white-space:nowrap;"><span style="background:#2980b9;color:white;border-radius:5px;padding:2px 8px;font-size:11px;font-weight:700;">💶 Monnaie</span></td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Manipulation de pièces et billets pour les activités monnaie en cycle 2/3.</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;white-space:nowrap;"><span style="background:#8e44ad;color:white;border-radius:5px;padding:2px 8px;font-size:11px;font-weight:700;">🧮 Calcul Mental</span></td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Générateur de calculs mentaux paramétrables. Affichage séquentiel des opérations.</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;white-space:nowrap;"><span style="background:#16a085;color:white;border-radius:5px;padding:2px 8px;font-size:11px;font-weight:700;">🔤 Ordre Alpha.</span></td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Activité pour classer des mots dans l'ordre alphabétique. Mots configurables.</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;white-space:nowrap;"><span style="background:#480eb3;color:white;border-radius:5px;padding:2px 8px;font-size:11px;font-weight:700;">🧘 Défi Calme</span></td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Outil de gestion du calme en classe avec animations apaisantes. Plein écran disponible.</td></tr>
          <tr><td style="padding:8px 12px;white-space:nowrap;"><span style="background:#FF692A;color:white;border-radius:5px;padding:2px 8px;font-size:11px;font-weight:700;">🔧 OutilsProfs</span></td><td style="padding:8px 12px;color:#444;">Ouvre directement outilsprofs.fr dans un widget intégré. Accès micro et caméra autorisés. Plein écran disponible.</td></tr>
        </table>
        <div style="background:#eef7ff;border-left:4px solid #2B7FFF;border-radius:0 8px 8px 0;padding:10px 14px;font-size:12.5px;color:#1a4d8f;">💡 Le sonomètre et le radar de bruit nécessitent l'autorisation d'accès au microphone dans le navigateur.</div>
      </div>

      <!-- MÉDIAS -->
      <div id="h-widgets-media" class="help-section">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">🎞️ Widgets Médias</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:14px;">Accessibles via <strong>＋ → Contenu → Widgets</strong>.</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Widget</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Description &amp; fonctionnement</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;white-space:nowrap;"><span style="background:#E7180B;color:white;border-radius:5px;padding:2px 8px;font-size:11px;font-weight:700;">🎬 YouTube</span></td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Lecteur YouTube intégré. Collez l'URL ou l'ID de la vidéo. Mode audio seul disponible. Plein écran. La vidéo est sauvegardée avec le tableau.</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;white-space:nowrap;"><span style="background:#c8a000;color:white;border-radius:5px;padding:2px 8px;font-size:11px;font-weight:700;">💻 Fenêtre Web</span></td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Navigateur intégré — affichez n'importe quel site web. Saisissez l'URL dans la barre. Plein écran disponible. Certains sites bloquent l'intégration (iFrame).</td></tr>
          <tr><td style="padding:8px 12px;white-space:nowrap;"><span style="background:#E74C3C;color:white;border-radius:5px;padding:2px 8px;font-size:11px;font-weight:700;">📄 PDF</span></td><td style="padding:8px 12px;color:#444;">Affiche un fichier PDF local. Navigation par pages. <strong>Le PDF est sauvegardé automatiquement</strong> dans le navigateur (fichiers &lt;5 Mo).</td></tr>
        </table>
        <div style="font-size:0.97em;font-weight:700;color:#2B7FFF;margin:18px 0 8px 0;">🖼️ Coller une image (Ctrl+V)</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:8px;">Appuyez sur <strong>Ctrl+V</strong> (ou ⌘+V sur Mac) n'importe où sur le bureau pour coller une image depuis le presse-papier. Elle apparaît comme un sticker repositionnable et redimensionnable.</p>
        <div style="background:#eef7ff;border-left:4px solid #2B7FFF;border-radius:0 8px 8px 0;padding:10px 14px;font-size:12.5px;color:#1a4d8f;">💡 Fonctionne avec des captures d'écran copiées depuis n'importe quel logiciel.</div>
      </div>

      <!-- SÉLECTION -->
      <div id="h-selection" class="help-section">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">🖱️ Sélection de widgets</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Action</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Résultat</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Clic simple sur un widget</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Le sélectionne et l'amène au premier plan</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Clic sur le bureau vide</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Désélectionne tout</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;"><kbd>Maj</kbd> + clic</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Ajoute le widget à la sélection (multi-sélection)</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Glisser sur le bureau vide</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Sélection par lasso (rectangle élastique)</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;"><kbd>Ctrl+A</kbd></td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Sélectionne tous les widgets</td></tr>
          <tr><td style="padding:8px 12px;"><kbd>Suppr</kbd> ou <kbd>Backspace</kbd></td><td style="padding:8px 12px;color:#444;">Supprime les widgets sélectionnés</td></tr>
        </table>
        <div style="background:#eef7ff;border-left:4px solid #2B7FFF;border-radius:0 8px 8px 0;padding:10px 14px;font-size:12.5px;color:#1a4d8f;">💡 En multi-sélection, vous pouvez déplacer, supprimer ou grouper tous les widgets d'un coup.</div>
      </div>

      <!-- DÉPLACEMENT & RESIZE -->
      <div id="h-deplacement" class="help-section">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">✥ Déplacement &amp; Redimensionnement</div>
        <div style="font-size:0.97em;font-weight:700;color:#2B7FFF;margin:0 0 8px 0;">Déplacement</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Action</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Résultat</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Glisser la poignée <strong>✥</strong></td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Déplace le widget librement</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;"><kbd>↑ ↓ ← →</kbd></td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Déplace de 1 px (widget sélectionné)</td></tr>
          <tr><td style="padding:8px 12px;"><kbd>Maj</kbd> + <kbd>↑ ↓ ← →</kbd></td><td style="padding:8px 12px;color:#444;">Déplace de 10 px</td></tr>
        </table>
        <div style="font-size:0.97em;font-weight:700;color:#2B7FFF;margin:18px 0 8px 0;">Redimensionnement</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:8px;">Survolez le widget → triangle gris en <strong>bas à droite</strong> → glissez pour redimensionner librement.</p>
        <div style="background:#eef7ff;border-left:4px solid #2B7FFF;border-radius:0 8px 8px 0;padding:10px 14px;font-size:12.5px;color:#1a4d8f;">💡 Les widgets Date et Heure adaptent leur police automatiquement — agrandissez-les pour un affichage vidéoprojecteur lisible.</div>
      </div>

      <!-- ROTATION -->
      <div id="h-rotation" class="help-section">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">↻ Rotation</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:10px;">La poignée <strong>↻</strong> se trouve à droite (milieu) de chaque widget. Glissez pour faire pivoter.</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Comportement</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Détail</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Rotation libre</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Glissez la poignée ↻ dans n'importe quelle direction</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Magnétisme angulaire</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">S'accroche à 0°, 45°, 90°, 135°, 180°… (zone ±5°)</td></tr>
          <tr><td style="padding:8px 12px;">Remise à zéro</td><td style="padding:8px 12px;color:#444;">Menu contextuel ☰ → <em>Remettre à 0°</em></td></tr>
        </table>
      </div>

      <!-- GROUPES -->
      <div id="h-groupes" class="help-section">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">⛓️ Groupes de widgets</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:10px;">Regroupez plusieurs widgets pour les déplacer, redimensionner ou supprimer ensemble.</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Action</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Comment</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Créer un groupe</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Sélectionner plusieurs widgets → <kbd>Ctrl+G</kbd> ou ☰ → <em>Grouper</em></td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Dissoudre un groupe</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;"><kbd>Ctrl+Maj+G</kbd> ou ☰ → <em>Dégrouper</em></td></tr>
          <tr><td style="padding:8px 12px;">Déplacer le groupe</td><td style="padding:8px 12px;color:#444;">Glissez la poignée ✥ de n'importe quel widget du groupe</td></tr>
        </table>
        <div style="background:#eef7ff;border-left:4px solid #2B7FFF;border-radius:0 8px 8px 0;padding:10px 14px;font-size:12.5px;color:#1a4d8f;">💡 Un groupe est sauvegardé et restauré avec le tableau. Utile pour verrouiller une mise en page.</div>
      </div>

      <!-- TEXTE & FORMAT -->
      <div id="h-texte" class="help-section">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">🖊️ Texte &amp; Formatage</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:10px;">Cliquez dans un widget Texte ou Devoirs pour entrer en édition. La <strong>barre de formatage</strong> apparaît automatiquement en haut de l'écran.</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Contrôle</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Action</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Sélecteur de police</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Changer la police (inclut BelleAllureGS, cursives, sans-serif…)</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Taille (px)</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Taille en pixels, saisie libre ou boutons ＋/−</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;"><strong>G</strong> / <em>I</em> / <u>S</u></td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Gras, Italique, Souligné</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Alignement</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Gauche, Centré, Droite, Justifié</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Interligne</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Espacement entre les lignes</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">🎨 Couleur texte</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Color picker : grille + saisie hex + sélecteur natif</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">🖍️ Surlignage</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Couleur de surlignage du texte sélectionné</td></tr>
          <tr><td style="padding:8px 12px;">🎨 Fond du widget</td><td style="padding:8px 12px;color:#444;">Couleur de fond + opacité (slider %) + bouton Transparent</td></tr>
        </table>
        <div style="background:#eef7ff;border-left:4px solid #2B7FFF;border-radius:0 8px 8px 0;padding:10px 14px;font-size:12.5px;color:#1a4d8f;">💡 Sélectionnez du texte avant de changer la couleur ou la police pour n'affecter que la sélection.</div>
      </div>

      <!-- FORMES -->
      <div id="h-formes" class="help-section">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">🔲 Formes géométriques</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:10px;">Activez via <strong>＋ → Annotation → Formes</strong>.</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Outil</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Fonctionnement</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Rectangle / Ellipse / Ligne / Flèche</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Cliquez puis glissez sur le bureau pour tracer</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Couleur contour &amp; remplissage</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Color pickers dans la barre formes (transparent possible)</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Épaisseur du trait</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Slider ou saisie numérique dans la barre</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Modifier une forme</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Cliquez sur la forme → panneau d'édition (couleurs, épaisseur, opacité)</td></tr>
          <tr><td style="padding:8px 12px;">Supprimer une forme</td><td style="padding:8px 12px;color:#444;">Sélectionnez → <kbd>Suppr</kbd> ou bouton × dans la barre</td></tr>
        </table>
        <div style="background:#eef7ff;border-left:4px solid #2B7FFF;border-radius:0 8px 8px 0;padding:10px 14px;font-size:12.5px;color:#1a4d8f;">💡 Les formes sont déplaçables, redimensionnables et pivotables. Elles se sauvegardent avec le tableau.</div>
      </div>

      <!-- DESSIN LIBRE -->
      <div id="h-dessin" class="help-section">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">✏️ Dessin libre &amp; Géométrie</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:10px;">Activez via <strong>＋ → Annotation → Dessin</strong>. Tracez librement avec votre souris, stylet ou doigt.</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Contrôle</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Action</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">🎨 Couleur</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Color picker dans la barre de dessin</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Épaisseur</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Slider d'épaisseur du trait (1 à 30 px)</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">🧽 Gomme</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Bascule en mode gomme (efface les traits)</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">🗑️ Tout effacer</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Efface tous les traits d'un coup</td></tr>
          <tr><td style="padding:8px 12px;">Quitter</td><td style="padding:8px 12px;color:#444;">Re-cliquez sur ✏️ Dessin dans le menu</td></tr>
        </table>
        <div style="background:#eef7ff;border-left:4px solid #2B7FFF;border-radius:0 8px 8px 0;padding:10px 14px;font-size:12.5px;color:#1a4d8f;">💡 En mode dessin, les widgets ne sont plus interactifs pour éviter les déplacements accidentels.</div>

        <div style="font-size:0.97em;font-weight:700;color:#8E51FF;margin:22px 0 8px 0;">📐 Outils Géométrie</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:10px;">Disponibles dans la <strong>barre de dessin</strong> via le bouton <strong>📐 Géométrie</strong>. Trois instruments posables sur le tableau, déplaçables et pivotables.</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:14px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Instrument</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Description &amp; utilisation</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;white-space:nowrap;font-weight:700;">📏 Règle</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Règle graduée posée sur le tableau. Glissez-la par le corps pour la déplacer, utilisez la poignée <strong>↻</strong> pour la faire pivoter. Bouton <strong>Tracer</strong> pour dessiner la droite le long de la règle.</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;white-space:nowrap;font-weight:700;">📐 Équerre</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Équerre à angle droit déplaçable et pivotable. Bouton <strong>Tracer</strong> pour dessiner les deux côtés de l'équerre sur le tableau.</td></tr>
          <tr><td style="padding:8px 12px;white-space:nowrap;font-weight:700;">⭕ Compas</td><td style="padding:8px 12px;color:#444;">Compas avec bras articulés. Slider <strong>Rayon</strong> pour ajuster l'ouverture (20 à 400 px). Cercle fantôme en pointillés pour prévisualiser. Bouton <strong>⭕ Tracer le cercle</strong> pour le dessiner.</td></tr>
        </table>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:14px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Action commune</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Comment</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Déplacer l'instrument</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Glisser directement sur le corps de l'instrument</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Faire pivoter</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Poignée <strong>↻</strong> bleue en haut à droite de l'instrument</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Tracer</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Bouton <strong>Tracer</strong> violet sur l'instrument — utilise la couleur et l'épaisseur actives dans la barre de dessin</td></tr>
          <tr><td style="padding:8px 12px;">Supprimer l'instrument</td><td style="padding:8px 12px;color:#444;">Bouton <strong>×</strong> rouge en haut à gauche de l'instrument</td></tr>
        </table>
        <div style="background:#f3eeff;border-left:4px solid #8E51FF;border-radius:0 8px 8px 0;padding:10px 14px;font-size:12.5px;color:#4a1a8f;">💡 Les tracés produits par les outils géométrie s'intègrent dans les traits de dessin — ils sont sauvegardés avec le tableau et effaçables avec la gomme ou 🗑️.</div>
      </div>

      <!-- GOMME -->
      <div id="h-gomme" class="help-section">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">🧽 Gomme</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:10px;">Disponible dans la barre de dessin. Elle n'efface que les <strong>traits de dessin libre</strong>, pas les widgets ni les formes.</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Action</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Résultat</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Clic sur 🧽</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Active la gomme (curseur circulaire)</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Glisser sur un trait</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Efface le trait au passage</td></tr>
          <tr><td style="padding:8px 12px;">Bouton 🗑️</td><td style="padding:8px 12px;color:#444;">Efface <strong>tous</strong> les traits en une fois</td></tr>
        </table>
      </div>

      <!-- PROJETS -->
      <div id="h-projets" class="help-section">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">📁 Projets</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:10px;">Un <strong>projet</strong> est un ensemble de tableaux sauvegardé dans votre navigateur (IndexedDB). Vous pouvez avoir autant de projets que vous voulez.</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Action</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Comment</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">✨ Nouveau projet</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Menu Fichier → Nouveau projet → saisir un nom. Sauvegardé immédiatement en IndexedDB.</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">📝 Nouveau brouillon</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Menu Fichier → Nouveau brouillon. Aucune sauvegarde automatique. Fond vieux rose distinctif.</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">📁 Tous mes projets</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Bibliothèque : liste tous les projets avec leurs tableaux en accordéon. Double-clic ou 📂 pour ouvrir.</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">⭐ Projets favoris</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Cliquez sur ☆ dans la bibliothèque pour marquer un favori → accès rapide dans le menu Fichier.</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">✏️ Renommer</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Bouton ✏️ dans la bibliothèque de projets</td></tr>
          <tr><td style="padding:8px 12px;">× Supprimer</td><td style="padding:8px 12px;color:#444;">Bouton × dans la bibliothèque de projets</td></tr>
        </table>
        <div style="font-size:0.97em;font-weight:700;color:#2B7FFF;margin:14px 0 8px 0;">📝 Mode brouillon</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:8px;">Le brouillon ne s'enregistre <strong>nulle part automatiquement</strong>. La bibliothèque affiche un bandeau jaune "📝 Brouillon en cours" avec le bouton <strong>💾 Enregistrer</strong> pour lui donner un nom.</p>
        <div style="background:#fff8e6;border-left:4px solid #f39c12;border-radius:0 8px 8px 0;padding:10px 14px;font-size:12.5px;color:#7a5000;">⚠️ Si vous ouvrez un autre projet sans enregistrer le brouillon, son contenu sera perdu définitivement.</div>
      </div>

      <!-- SCÈNES -->
      <div id="h-scenes" class="help-section">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">🗂️ Tableaux (Scènes)</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:10px;">Un projet peut contenir jusqu'à <strong>10 tableaux</strong> indépendants, chacun avec son contenu et son fond. Accédez via <strong>＋ → Fichier → Tableaux de ce projet</strong>.</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Action</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Comment</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Changer de tableau</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Cliquez sur son nom dans le sous-menu</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Créer un tableau</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Bouton <strong>＋ Nouveau tableau</strong> en bas du sous-menu</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Renommer</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Bouton ✏️ à droite du tableau dans la liste</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Supprimer</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Bouton × (impossible si c'est le dernier tableau)</td></tr>
          <tr><td style="padding:8px 12px;">Réordonner</td><td style="padding:8px 12px;color:#444;">Glissez la poignée ⠿ à gauche du tableau</td></tr>
        </table>
        <div style="background:#eef7ff;border-left:4px solid #2B7FFF;border-radius:0 8px 8px 0;padding:12px 16px;font-size:12.5px;color:#1a4d8f;margin:16px 0;">
          💡 <strong>Exemple d'organisation :</strong><br><br>
          • <strong>Tableau 1 — Accueil</strong> : date, météo, planning de la journée<br>
          • <strong>Tableau 2 — Maths</strong> : leçon du jour, minuteur, calcul mental<br>
          • <strong>Tableau 3 — Français</strong> : texte affiché, exercices, vocabulaire<br>
          • <strong>Tableau 4 — Fin de journée</strong> : devoirs, tirage au sort, YouTube
        </div>
      </div>

      <!-- FOND D'ÉCRAN -->
      <div id="h-fond" class="help-section">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">🖼️ Fond d'écran</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:10px;">Accédez via <strong>＋ → Système → Affichage → Fond d'écran</strong>. Chaque tableau a son propre fond.</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Type de fond</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Options disponibles</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Couleur unie</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Palette de couleurs prédéfinies + saisie hex + sélecteur natif</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Réglures</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Séyès (paille, blanc, avec marge) · Lignes simples · Grands carreaux · Petits carreaux · Ardoise</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Échelle du fond</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Slider pour ajuster la taille de la réglure</td></tr>
          <tr><td style="padding:8px 12px;">Aucun fond</td><td style="padding:8px 12px;color:#444;">Fond noir par défaut</td></tr>
        </table>
      </div>

      <!-- SAUVEGARDE -->
      <div id="h-sauvegarde" class="help-section">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">💾 Sauvegarde</div>
        <div style="font-size:0.97em;font-weight:700;color:#2B7FFF;margin:0 0 8px 0;">Sauvegarde automatique</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:14px;">Tout est sauvegardé automatiquement dans le navigateur (IndexedDB + localStorage) après chaque modification. Vous retrouvez votre travail à la prochaine ouverture.</p>
        <div style="font-size:0.97em;font-weight:700;color:#2B7FFF;margin:0 0 8px 0;">Exporter / Importer</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Action</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Détail</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">💾 Sauvegarder (JSON)</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Exporte le projet courant en fichier .json téléchargeable</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">📂 Charger (JSON)</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Importe un fichier .json précédemment exporté</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">📤 Tout exporter</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Exporte <strong>tous</strong> vos projets en un seul fichier de sauvegarde globale</td></tr>
          <tr><td style="padding:8px 12px;">📥 Tout importer</td><td style="padding:8px 12px;color:#444;">Restaure tous les projets depuis une sauvegarde globale (remplace l'existant)</td></tr>
        </table>
        <div style="background:#eef7ff;border-left:4px solid #2B7FFF;border-radius:0 8px 8px 0;padding:10px 14px;font-size:12.5px;color:#1a4d8f;margin-bottom:10px;">💡 Utilisez <strong>📤 Tout exporter</strong> régulièrement comme sauvegarde de sécurité. Changement de navigateur ou vidage du cache : restaurez avec 📥.</div>
        <div style="background:#e8f5e9;border-left:4px solid #4caf50;border-radius:0 8px 8px 0;padding:10px 14px;font-size:12.5px;color:#2e7d32;">✅ Les PDF sont <strong>sauvegardés automatiquement</strong>. <em>Fichiers &gt;5 Mo : sauvegarde non garantie.</em></div>
      </div>

      <!-- ANNULER / REFAIRE -->
      <div id="h-undoredo" class="help-section">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">↩ Annuler &amp; Refaire</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:14px;">Boutons <strong>↩ ↪</strong> dans le menu Système. Historique de <strong>60 états</strong> par session.</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Bouton</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Raccourci</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Action</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;font-weight:700;">↩ Annuler</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;"><kbd>Ctrl+Z</kbd></td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Revient à l'état précédent</td></tr>
          <tr><td style="padding:8px 12px;font-weight:700;">↪ Refaire</td><td style="padding:8px 12px;color:#444;"><kbd>Ctrl+Y</kbd> / <kbd>Ctrl+Maj+Z</kbd></td><td style="padding:8px 12px;color:#444;">Rétablit l'action annulée</td></tr>
        </table>
        <div style="background:#eef7ff;border-left:4px solid #2B7FFF;border-radius:0 8px 8px 0;padding:10px 14px;font-size:12.5px;color:#1a4d8f;margin-bottom:10px;">💡 Les modifications de texte sont enregistrées dans l'historique après 800 ms d'inactivité.</div>
        <div style="background:#fff8e6;border-left:4px solid #f39c12;border-radius:0 8px 8px 0;padding:10px 14px;font-size:12.5px;color:#7a5000;">⚠️ L'historique est perdu si vous fermez ou rechargez la page.</div>
      </div>

      <!-- POINTEUR LASER -->
      <div id="h-laser" class="help-section">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">🔴 Pointeur laser</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:10px;">Activez via <strong>＋ → Système → Affichage → Pointeur laser</strong>. Le curseur est remplacé par un <strong>point rouge lumineux</strong>.</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Action</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Résultat</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Clic sur 🔴</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Active le pointeur laser</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Re-clic sur 🔴</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Désactive le pointeur</td></tr>
          <tr><td style="padding:8px 12px;"><kbd>Échap</kbd></td><td style="padding:8px 12px;color:#444;">Désactive en urgence</td></tr>
        </table>
        <div style="background:#eef7ff;border-left:4px solid #2B7FFF;border-radius:0 8px 8px 0;padding:10px 14px;font-size:12.5px;color:#1a4d8f;">💡 Le point rouge est beaucoup plus visible sur vidéoprojecteur que le curseur système.</div>
      </div>

      <!-- ASTUCES AVANCÉES -->
      <div id="h-avance" class="help-section">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">⚙️ Astuces avancées</div>

        <div style="font-size:0.97em;font-weight:700;color:#2B7FFF;margin:0 0 8px 0;">🖼️ Fond transparent d'un widget</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:14px;">Menu contextuel ☰ → <em>Fond transparent</em>. Le contenu flotte directement sur le bureau sans cadre. Réversible via ☰ → couleur de fond.</p>

        <div style="font-size:0.97em;font-weight:700;color:#2B7FFF;margin:0 0 8px 0;">📋 Dupliquer un widget</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:14px;">Menu contextuel ☰ → <em>Dupliquer</em>. La copie est placée légèrement décalée et conserve tout le contenu et le style.</p>

        <div style="font-size:0.97em;font-weight:700;color:#2B7FFF;margin:0 0 8px 0;">☀️ Mode clair du menu</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:14px;"><strong>＋ → Système → Affichage → Mode clair</strong>. Le menu principal passe en fond blanc — utile en salle lumineuse.</p>

        <div style="font-size:0.97em;font-weight:700;color:#2B7FFF;margin:0 0 8px 0;">😀 Stickers (emojis)</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:14px;"><strong>＋ → Annotation → Stickers</strong>. Cliquez sur un emoji pour le déposer. Le sticker est déplaçable, redimensionnable et rotatif.</p>

        <div style="font-size:0.97em;font-weight:700;color:#2B7FFF;margin:0 0 8px 0;">⌨️ Tous les raccourcis clavier</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:10px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Raccourci</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Action</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;"><kbd>Ctrl+Z</kbd></td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Annuler</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;"><kbd>Ctrl+Y</kbd></td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Refaire</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;"><kbd>Ctrl+A</kbd></td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Sélectionner tous les widgets</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;"><kbd>Ctrl+G</kbd></td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Grouper la sélection</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;"><kbd>Ctrl+Maj+G</kbd></td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Dégrouper</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;"><kbd>Suppr</kbd> / <kbd>Backspace</kbd></td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Supprimer les widgets sélectionnés</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;"><kbd>↑ ↓ ← →</kbd></td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Déplacer de 1 px</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;"><kbd>Maj + ↑ ↓ ← →</kbd></td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Déplacer de 10 px</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;"><kbd>Ctrl+V</kbd></td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Coller une image depuis le presse-papier</td></tr>
          <tr><td style="padding:8px 12px;"><kbd>Échap</kbd></td><td style="padding:8px 12px;color:#444;">Désélectionner / Quitter le dessin / Désactiver le laser</td></tr>
        </table>
      </div>

    </div><!-- /contenu -->
  </div><!-- /corps -->

  <!-- PIED -->
  <div style="padding:14px 28px;border-top:1px solid #e5e8ee;display:flex;justify-content:flex-end;flex-shrink:0;background:#fafbfc;">
    <button onclick="closeHelpModal()" style="background:#2B7FFF;color:white;border:none;padding:9px 22px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;">Fermer</button>
  </div>

</div><!-- /modal -->
</div><!-- /overlay -->
  `;

  // ── CSS ────────────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    .help-nav {
      display: flex; align-items: center; gap: 8px;
      padding: 9px 18px; cursor: pointer; font-size: 13px;
      color: #444; font-weight: 500; border-left: 3px solid transparent;
      transition: all 0.15s; user-select: none;
    }
    .help-nav:hover { background: #e8edf5; color: #2B7FFF; }
    .help-section { display: none; }
    #help-sidebar::-webkit-scrollbar { width: 4px; }
    #help-sidebar::-webkit-scrollbar-thumb { background: #ccc; border-radius: 2px; }
  `;
  document.head.appendChild(style);

  document.body.insertAdjacentHTML('beforeend', html);

  document.getElementById('help-modal-overlay').addEventListener('mousedown', function (e) {
    if (e.target === this) closeHelpModal();
  });
})();

// ── Fonctions globales ─────────────────────────────────────────────────────

function openHelpModal() {
  const o = document.getElementById('help-modal-overlay');
  o.style.display = 'flex';
  helpShow(document.querySelector('.help-nav[data-s="h-intro"]'));
}

function helpShow(item) {
  document.querySelectorAll('.help-nav').forEach(i => {
    i.style.borderLeftColor = 'transparent';
    i.style.background = '';
    i.style.color = '#444';
    i.style.fontWeight = '500';
  });
  document.querySelectorAll('.help-section').forEach(s => s.style.display = 'none');
  item.style.borderLeftColor = '#2B7FFF';
  item.style.background      = '#e8edf5';
  item.style.color           = '#2B7FFF';
  item.style.fontWeight      = '700';
  document.getElementById(item.dataset.s).style.display = 'block';
}

function closeHelpModal() {
  document.getElementById('help-modal-overlay').style.display = 'none';
}
