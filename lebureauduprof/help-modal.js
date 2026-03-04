// =========================================================================
// MODALE D'AIDE — Le Bureau du Prof
// =========================================================================

(function () {
  // ── Injection du HTML ──────────────────────────────────────────────────
  const html = `
<div id="help-modal-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.72);z-index:20010;justify-content:center;align-items:center;padding:20px;">
<div style="background:#fff;border-radius:18px;width:100%;max-width:860px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 24px 80px rgba(0,0,0,0.5);overflow:hidden;">

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
    <nav id="help-sidebar" style="width:210px;flex-shrink:0;background:#f4f6f9;border-right:1px solid #e5e8ee;overflow-y:auto;padding:14px 0;">
      <div style="padding:4px 16px 6px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#999;">Vue d'ensemble</div>
      <div class="help-nav" data-s="h-intro"       onclick="helpShow(this)" style="border-left-color:#2B7FFF;background:#e8edf5;color:#2B7FFF;font-weight:700;">🏠 Introduction</div>
      <div class="help-nav" data-s="h-menu"         onclick="helpShow(this)">＋ Le menu principal</div>
      <div style="height:1px;background:#e0e4ea;margin:8px 18px;"></div>
      <div style="padding:4px 16px 6px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#999;">Contenu</div>
      <div class="help-nav" data-s="h-widgets"     onclick="helpShow(this)">📦 Widgets</div>
      <div class="help-nav" data-s="h-selection"   onclick="helpShow(this)">🖱️ Sélection</div>
      <div class="help-nav" data-s="h-deplacement" onclick="helpShow(this)">✥ Déplacement</div>
      <div class="help-nav" data-s="h-rotation"    onclick="helpShow(this)">↻ Rotation</div>
      <div class="help-nav" data-s="h-groupes"     onclick="helpShow(this)">⛓️ Groupes</div>
      <div style="height:1px;background:#e0e4ea;margin:8px 18px;"></div>
      <div style="padding:4px 16px 6px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#999;">Annotation</div>
      <div class="help-nav" data-s="h-texte"       onclick="helpShow(this)">🖊️ Texte &amp; Format</div>
      <div class="help-nav" data-s="h-formes"      onclick="helpShow(this)">🔲 Formes</div>
      <div class="help-nav" data-s="h-dessin"      onclick="helpShow(this)">✏️ Dessin libre</div>
      <div class="help-nav" data-s="h-gomme"       onclick="helpShow(this)">🧽 Gomme</div>
      <div style="height:1px;background:#e0e4ea;margin:8px 18px;"></div>
      <div style="padding:4px 16px 6px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#999;">Système</div>
      <div class="help-nav" data-s="h-fond"        onclick="helpShow(this)">🖼️ Fond d'écran</div>
      <div class="help-nav" data-s="h-sauvegarde"  onclick="helpShow(this)">💾 Sauvegarde</div>
      <div class="help-nav" data-s="h-undoredo"    onclick="helpShow(this)">↩ Annuler / Refaire</div>
      <div class="help-nav" data-s="h-avance"      onclick="helpShow(this)">⚙️ Options avancées</div>
      <div class="help-nav" data-s="h-scenes"      onclick="helpShow(this)">🗂️ Scènes</div>
      <div class="help-nav" data-s="h-laser"       onclick="helpShow(this)">🔴 Pointeur laser</div>
    </nav>

    <!-- CONTENU -->
    <div style="flex:1;overflow-y:auto;padding:28px 32px;font-family:'Segoe UI',system-ui,sans-serif;">

      <!-- INTRODUCTION -->
      <div id="h-intro" class="help-section" style="display:block;">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">🏠 Bienvenue sur Le Bureau du Prof</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:10px;">Le Bureau du Prof est un <strong>tableau de bord interactif</strong> conçu pour les enseignants. Il permet d'afficher simultanément des widgets (heure, date, devoirs, agenda, vidéos…), de dessiner librement, d'ajouter des formes géométriques et de tout sauvegarder.</p>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:10px;">Le tableau respecte un <strong>format 16:9</strong> et s'adapte automatiquement à la taille de votre écran ou vidéoprojecteur.</p>
        <div style="font-size:0.97em;font-weight:700;color:#2B7FFF;margin:18px 0 8px 0;">🗺️ Organisation de l'interface</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
          <div style="background:#f8f9fb;border:1px solid #e5e8ee;border-radius:10px;padding:14px 16px;"><div style="font-size:13px;font-weight:700;color:#222;margin-bottom:6px;">＋ Bouton menu (bas-gauche)</div><p style="font-size:12.5px;color:#444;margin:0;">Ouvre le <strong>menu principal</strong> organisé en trois rubriques : Contenu, Annotation, Système.</p></div>
          <div style="background:#f8f9fb;border:1px solid #e5e8ee;border-radius:10px;padding:14px 16px;"><div style="font-size:13px;font-weight:700;color:#222;margin-bottom:6px;">🖊️ Barre de texte</div><p style="font-size:12.5px;color:#444;margin:0;">Apparaît automatiquement en cliquant dans un widget Texte ou Devoirs. Police, taille, couleur, gras, italique…</p></div>
          <div style="background:#f8f9fb;border:1px solid #e5e8ee;border-radius:10px;padding:14px 16px;"><div style="font-size:13px;font-weight:700;color:#222;margin-bottom:6px;">💾 Sauvegarde auto</div><p style="font-size:12.5px;color:#444;margin:0;">Tout est sauvegardé dans le navigateur après chaque modification. Utilisez 💾 (menu → Fichier) pour exporter en .json.</p></div>
          <div style="background:#f8f9fb;border:1px solid #e5e8ee;border-radius:10px;padding:14px 16px;"><div style="font-size:13px;font-weight:700;color:#222;margin-bottom:6px;">📽️ Mode présentation</div><p style="font-size:12.5px;color:#444;margin:0;">Bouton fixe en bas à droite. Masque toute l'interface pour projeter le tableau en plein écran propre.</p></div>
        </div>
        <div style="background:#eef7ff;border-left:4px solid #2B7FFF;border-radius:0 8px 8px 0;padding:10px 14px;font-size:12.5px;color:#1a4d8f;margin:10px 0;">💡 <strong>Démarrage :</strong> Cliquez sur le bouton <strong>＋</strong> en bas à gauche, choisissez un widget dans la rubrique <em>Contenu</em>, puis glissez-le en cliquant sur la poignée <strong>✥</strong> qui apparaît sur sa gauche.</div>
        <div style="background:#1a1a2e;border-left:4px solid #8E51FF;border-radius:0 8px 8px 0;padding:10px 14px;font-size:12.5px;color:#ccc;margin:10px 0;">📽️ <strong>Mode présentation :</strong> Cliquez sur <strong>📽️</strong> en bas à droite pour basculer en plein écran propre. Appuyez sur <strong>Échap</strong> ou « Quitter la présentation » pour revenir.</div>
      </div>

      <!-- LE MENU PRINCIPAL -->
      <div id="h-menu" class="help-section">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">＋ Le menu principal</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:14px;">Le menu s'ouvre en cliquant sur le bouton <strong>＋</strong> en bas à gauche. Il est organisé en <strong>trois rubriques</strong>. Cliquez à l'extérieur ou sur un élément pour le fermer.</p>
        <div style="font-size:0.97em;font-weight:700;color:#27ae60;margin:18px 0 8px 0;"><span style="background:#27ae60;color:white;border-radius:5px;padding:1px 7px;font-size:11px;">C</span> Rubrique Contenu</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Entrée</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Ce qu'elle fait</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">🎞️ <strong>Médias</strong> ›</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Sous-menu : PDF 📄 · Fenêtre Web 💻 · YouTube 🎬</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">🛠️ <strong>Outils</strong> ›</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Sous-menu : OutilsProfs · Défi Calme 🧘</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">📦 <strong>Widgets</strong> ›</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Sous-menu : Date 📅 · Heure 🕒 · Météo ⛅ · Devoirs 📝 · Planning 📌</td></tr>
          <tr><td style="padding:8px 12px;">🖊️ <strong>Texte</strong></td><td style="padding:8px 12px;color:#444;">Crée directement un widget Texte et ouvre son éditeur</td></tr>
        </table>
        <div style="font-size:0.97em;font-weight:700;color:#8E51FF;margin:18px 0 8px 0;"><span style="background:#8E51FF;color:white;border-radius:5px;padding:1px 7px;font-size:11px;">B</span> Rubrique Annotation</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Entrée</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Ce qu'elle fait</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">😀 <strong>Stickers</strong></td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Ouvre le panneau de stickers (emojis déposables)</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">🔲 <strong>Formes</strong></td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Active la barre d'outils des formes géométriques</td></tr>
          <tr><td style="padding:8px 12px;">✏️ <strong>Dessin</strong></td><td style="padding:8px 12px;color:#444;">Active la barre d'outils de dessin libre</td></tr>
        </table>
        <div style="font-size:0.97em;font-weight:700;color:#2B7FFF;margin:18px 0 8px 0;"><span style="background:#2B7FFF;color:white;border-radius:5px;padding:1px 7px;font-size:11px;">A</span> Rubrique Système</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Entrée</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Ce qu'elle fait</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">🖥️ <strong>Affichage</strong> ›</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Sous-menus : Scènes 🗂️ · Fond d'écran 🖼️ · Pointeur laser 🔴</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">🗄️ <strong>Fichier</strong> ›</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Sauvegarder 💾 · Charger 📂 · Effacer tout ❌</td></tr>
          <tr><td style="padding:8px 12px;">↩ ↪ ❓</td><td style="padding:8px 12px;color:#444;">Boutons Annuler, Refaire et Aide en bas de la rubrique</td></tr>
        </table>
        <div style="background:#eef7ff;border-left:4px solid #2B7FFF;border-radius:0 8px 8px 0;padding:10px 14px;font-size:12.5px;color:#1a4d8f;margin:10px 0;">💡 Les sous-menus (›) s'affichent en survolant l'entrée et se positionnent automatiquement selon l'espace disponible.</div>
      </div>

      <!-- WIDGETS -->
      <div id="h-widgets" class="help-section">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">📦 Les widgets disponibles</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:10px;">Chaque widget est une fenêtre flottante redimensionnable et déplaçable. Ouvrez <strong>＋ → Contenu</strong> puis choisissez le type souhaité.</p>
        <table style="width:100%;border-collapse:collapse;margin:10px 0 16px 0;font-size:13px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;color:#333;border-bottom:2px solid #dde2ea;">Widget</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;color:#333;border-bottom:2px solid #dde2ea;">Description</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;color:#333;border-bottom:2px solid #dde2ea;">Particularité</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;"><span style="background:#2B7FFF;color:white;border-radius:5px;padding:2px 8px;font-size:11.5px;font-weight:700;">🖊️ Texte</span></td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Zone de saisie libre avec mise en forme riche.</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Barre de formatage globale automatique</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;"><span style="background:#3BB8DB;color:white;border-radius:5px;padding:2px 8px;font-size:11.5px;font-weight:700;">📝 Devoirs</span></td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Widget pré-rempli pour noter les devoirs par classe.</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Contenu de départ modifiable</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;"><span style="background:#679638;color:white;border-radius:5px;padding:2px 8px;font-size:11.5px;font-weight:700;">📅 Date</span></td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Affiche le jour, numéro et mois en temps réel.</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Police auto-adaptative à la taille du widget</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;"><span style="background:#7CCF35;color:white;border-radius:5px;padding:2px 8px;font-size:11.5px;font-weight:700;">🕒 Heure</span></td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Horloge numérique temps réel (h:min sec).</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Taille de police auto + fond transparent</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;"><span style="background:#8E51FF;color:white;border-radius:5px;padding:2px 8px;font-size:11.5px;font-weight:700;">📌 Planning</span></td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Agenda journalier avec lignes horaires.</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Glisser-déposer des lignes, ajout/suppression</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;"><span style="background:#E7180B;color:white;border-radius:5px;padding:2px 8px;font-size:11.5px;font-weight:700;">🎬 YouTube</span></td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Lecteur YouTube intégré.</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Mode audio seul, plein écran</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;"><span style="background:#FFD230;color:#222;border-radius:5px;padding:2px 8px;font-size:11.5px;font-weight:700;">💻 Fenêtre Web</span></td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Navigateur intégré pour tout site web.</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Plein écran disponible</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;"><span style="background:#FF692A;color:white;border-radius:5px;padding:2px 8px;font-size:11.5px;font-weight:700;">🎒 OutilsProfs</span></td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Ouvre directement outilsprofs.fr</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Micro, caméra autorisés</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;"><span style="background:#480eb3;color:white;border-radius:5px;padding:2px 8px;font-size:11.5px;font-weight:700;">🧘 Défi Calme</span></td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Outil de gestion du calme en classe.</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Plein écran disponible</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;"><span style="background:#E74C3C;color:white;border-radius:5px;padding:2px 8px;font-size:11.5px;font-weight:700;">📄 PDF</span></td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Affiche un fichier PDF local.</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Sauvegardé automatiquement dans le navigateur ✅</td></tr>
          <tr><td style="padding:8px 12px;"><span style="background:#00AACC;color:white;border-radius:5px;padding:2px 8px;font-size:11.5px;font-weight:700;">⛅ Météo</span></td><td style="padding:8px 12px;color:#444;">Météo réelle de la ville de l'école.</td><td style="padding:8px 12px;color:#444;">Via Open-Meteo (gratuit). Clic sur la ville pour changer. Rafraîchi toutes les 10 min.</td></tr>
        </table>
        <div style="font-size:0.97em;font-weight:700;color:#2B7FFF;margin:18px 0 8px 0;">⚙️ Contrôles communs à tous les widgets</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Poignée</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Position</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Action</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;font-weight:700;">✥</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Gauche (milieu)</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Déplacer par glisser-déposer</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;font-weight:700;">↻</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Droite (milieu)</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Faire pivoter (magnétisme 0°/45°/90°…)</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;font-weight:700;">📌</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Haut (centre)</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Épingler au premier plan (fond doré = épinglé)</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;font-weight:700;">🔽</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Haut (droite du centre)</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Envoyer derrière tous les autres widgets</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;font-weight:700;">☰</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Bas (centre)</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Menu contextuel (dupliquer, modifier…)</td></tr>
          <tr><td style="padding:8px 12px;font-weight:700;color:#ff5f56;">×</td><td style="padding:8px 12px;color:#444;">Haut droite</td><td style="padding:8px 12px;color:#444;">Supprimer le widget</td></tr>
        </table>
        <div style="background:#eef7ff;border-left:4px solid #2B7FFF;border-radius:0 8px 8px 0;padding:10px 14px;font-size:12.5px;color:#1a4d8f;margin:14px 0;">💡 <strong>Redimensionner :</strong> Survolez un widget pour faire apparaître la poignée de redimensionnement (triangle gris, bas-droite).</div>
      </div>

      <!-- SÉLECTION -->
      <div id="h-selection" class="help-section">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">🖱️ Sélectionner des widgets</div>
        <div style="font-size:0.97em;font-weight:700;color:#2B7FFF;margin:0 0 8px 0;">Clic simple</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:10px;">Cliquer sur un widget le sélectionne (bordure bleue) et fait apparaître ses poignées natives.</p>
        <div style="font-size:0.97em;font-weight:700;color:#2B7FFF;margin:18px 0 8px 0;">Sélection multiple — Ctrl + clic</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:10px;">Maintenez <strong>Ctrl</strong> (ou ⌘ sur Mac) et cliquez sur plusieurs widgets. Recliquer sur un widget sélectionné le désélectionne.</p>
        <div style="font-size:0.97em;font-weight:700;color:#2B7FFF;margin:18px 0 8px 0;">Rectangle de sélection</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:10px;">Cliquez-glissez sur le <strong>fond du tableau</strong> pour tracer un rectangle. Tous les éléments à l'intérieur sont sélectionnés.</p>
        <div style="font-size:0.97em;font-weight:700;color:#2B7FFF;margin:18px 0 8px 0;">Overlay de sélection multiple</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Bouton</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Action</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;font-weight:700;">✥</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Déplacer tout le groupe simultanément</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;font-weight:700;">↻</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Faire pivoter autour du centre de la sélection</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;font-weight:700;">↘</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Redimensionner l'ensemble (+ Shift = proportionnel)</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;font-weight:700;color:#ff5f56;">×</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Supprimer tous les éléments sélectionnés</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;font-weight:700;">☰</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Menu contextuel (dupliquer, premier plan…)</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;font-weight:700;">⊞ Grouper</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Créer un groupe permanent (visible si ≥ 2 éléments)</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;font-weight:700;">⛓️ Dissocier</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Dissoudre un groupe existant</td></tr>
          <tr><td style="padding:8px 12px;font-weight:700;">↔ / ↕</td><td style="padding:8px 12px;color:#444;">Symétrie horizontale / verticale</td></tr>
        </table>
      </div>

      <!-- DÉPLACEMENT -->
      <div id="h-deplacement" class="help-section">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">✥ Déplacer un widget</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:10px;">Cliquez sur un widget pour le sélectionner, puis cliquez-glissez la poignée <strong>✥</strong> (côté gauche) pour le repositionner librement.</p>
        <div style="font-size:0.97em;font-weight:700;color:#2B7FFF;margin:18px 0 8px 0;">Déplacement au clavier</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:10px;">Avec un widget sélectionné, utilisez les <strong>touches fléchées</strong> (1 px). Maintenez <strong>Shift</strong> pour des pas de 10 px.</p>
        <div style="background:#eef7ff;border-left:4px solid #2B7FFF;border-radius:0 8px 8px 0;padding:10px 14px;font-size:12.5px;color:#1a4d8f;margin:10px 0;">💡 Le déplacement est enregistré dans l'historique — annulable avec ↩.</div>
      </div>

      <!-- ROTATION -->
      <div id="h-rotation" class="help-section">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">↻ Rotation d'un widget</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:10px;">Cliquez-glissez la poignée <strong>↻</strong> (côté droit) pour faire pivoter librement. Un indicateur d'angle s'affiche en temps réel.</p>
        <div style="font-size:0.97em;font-weight:700;color:#2B7FFF;margin:18px 0 8px 0;">Magnétisme angulaire</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:10px;">Maintenez <strong>Shift</strong> pour aimanter aux multiples de 45°. Double-cliquez sur la poignée pour remettre à 0°.</p>
      </div>

      <!-- GROUPES -->
      <div id="h-groupes" class="help-section">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">⛓️ Groupes de widgets</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:10px;">Sélectionnez plusieurs éléments puis cliquez sur <strong>⊞ Grouper</strong>. Le groupe se déplace, pivote et se redimensionne en bloc.</p>
        <div style="font-size:0.97em;font-weight:700;color:#2B7FFF;margin:18px 0 8px 0;">Dissocier un groupe</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:10px;">Cliquez sur le groupe, puis <strong>⛓️ Dissocier</strong>. Les éléments retrouvent leur indépendance et conservent leur position.</p>
        <div style="background:#eef7ff;border-left:4px solid #2B7FFF;border-radius:0 8px 8px 0;padding:10px 14px;font-size:12.5px;color:#1a4d8f;margin:10px 0;">💡 Les groupes sont sauvegardés dans le .json et restaurés à l'identique.</div>
      </div>

      <!-- TEXTE & FORMAT -->
      <div id="h-texte" class="help-section">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">🖊️ Texte &amp; Mise en forme</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:10px;">La barre de mise en forme apparaît dès que vous cliquez dans un widget <strong>Texte</strong> ou <strong>Devoirs</strong>.</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Outil</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Action</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;font-weight:700;">Police</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Sélection dans une liste de polices web-safe</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;font-weight:700;">Taille</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Saisie directe en px ou via les boutons − / +</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;font-weight:700;">G · I · S</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Gras, Italique, Souligné sur la sélection</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;font-weight:700;">Couleur texte</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Appliquée à la sélection ou au prochain caractère</td></tr>
          <tr><td style="padding:8px 12px;font-weight:700;">Surlignage</td><td style="padding:8px 12px;color:#444;">Fond coloré sur la sélection</td></tr>
        </table>
        <div style="background:#eef7ff;border-left:4px solid #2B7FFF;border-radius:0 8px 8px 0;padding:10px 14px;font-size:12.5px;color:#1a4d8f;margin:10px 0;">💡 Sélectionnez du texte avant de changer couleur ou surlignage pour l'appliquer uniquement à cette portion.</div>
      </div>

      <!-- FORMES -->
      <div id="h-formes" class="help-section">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">🔲 Formes géométriques</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:10px;">Activez via <strong>＋ → Annotation → Formes</strong>. Choisissez une forme puis cliquez-glissez pour la tracer.</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Forme</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Astuce</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Rectangle / Carré</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Shift pour carré parfait</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Ellipse / Cercle</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Shift pour cercle parfait</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Flèche / Ligne</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Shift pour angle contraint à 0°/45°/90°</td></tr>
          <tr><td style="padding:8px 12px;">Triangle / Losange…</td><td style="padding:8px 12px;color:#444;">Toutes les formes supportent couleur de remplissage et de contour</td></tr>
        </table>
        <div style="background:#eef7ff;border-left:4px solid #2B7FFF;border-radius:0 8px 8px 0;padding:10px 14px;font-size:12.5px;color:#1a4d8f;margin:10px 0;">💡 Une fois tracée, une forme se sélectionne, déplace, pivote et redimensionne comme un widget.</div>
      </div>

      <!-- DESSIN -->
      <div id="h-dessin" class="help-section">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">✏️ Dessin libre</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:10px;">Activez via <strong>＋ → Annotation → Dessin</strong>. Cliquez-glissez pour tracer des traits.</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Réglage</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Description</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Couleur</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Sélection dans la palette de la barre d'outils</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Taille du pinceau</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Curseur de 1 à 40 px</td></tr>
          <tr><td style="padding:8px 12px;">Opacité</td><td style="padding:8px 12px;color:#444;">Curseur de 10 % à 100 %</td></tr>
        </table>
        <div style="background:#eef7ff;border-left:4px solid #2B7FFF;border-radius:0 8px 8px 0;padding:10px 14px;font-size:12.5px;color:#1a4d8f;margin:10px 0;">💡 Chaque trait est indépendant : sélectionnable, déplaçable et supprimable.</div>
      </div>

      <!-- GOMME -->
      <div id="h-gomme" class="help-section">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">🧽 Gomme</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:10px;">Activez depuis la barre Dessin ou Formes. Passez sur un trait pour l'effacer. La gomme ne supprime pas les widgets ni les formes.</p>
        <div style="background:#eef7ff;border-left:4px solid #2B7FFF;border-radius:0 8px 8px 0;padding:10px 14px;font-size:12.5px;color:#1a4d8f;margin:10px 0;">💡 L'effacement est enregistré dans l'historique — récupérable avec ↩.</div>
      </div>

      <!-- FOND D'ÉCRAN -->
      <div id="h-fond" class="help-section">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">🖼️ Fond d'écran</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:10px;">Accédez via <strong>＋ → Système → Affichage → Fond d'écran</strong>.</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Option</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Description</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Couleurs unies</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Défaut, Ardoise, Vert tableau, Vieux rose, Beige, Noir</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Réglures</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Séyès (jaune ou blanc), Lignes simples, Grands carreaux, Petits carreaux, Ardoise lignée</td></tr>
          <tr><td style="padding:8px 12px;">Image personnalisée</td><td style="padding:8px 12px;color:#444;">📷 Importez votre propre image (png, jpg, gif…)</td></tr>
        </table>
        <div style="background:#eef7ff;border-left:4px solid #2B7FFF;border-radius:0 8px 8px 0;padding:10px 14px;font-size:12.5px;color:#1a4d8f;margin:10px 0;">💡 Chaque scène possède son propre fond d'écran indépendant.</div>
      </div>

      <!-- SAUVEGARDE -->
      <div id="h-sauvegarde" class="help-section">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">💾 Sauvegarde &amp; Chargement</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:10px;">Accédez via <strong>＋ → Système → Fichier</strong>.</p>
        <div style="font-size:0.97em;font-weight:700;color:#2B7FFF;margin:0 0 8px 0;">Sauvegarde automatique</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:10px;">Chaque modification est enregistrée automatiquement dans le <strong>localStorage</strong> du navigateur.</p>
        <div style="font-size:0.97em;font-weight:700;color:#2B7FFF;margin:18px 0 8px 0;">Exporter — 💾 / Charger — 📂</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:10px;">💾 génère un fichier <strong>.json</strong> de toutes vos scènes. 📂 restaure un fichier exporté précédemment.</p>
        <ul style="padding-left:20px;margin-bottom:10px;">
          <li style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:3px;">Toutes les scènes (nom, widgets, formes, dessins, fond)</li>
          <li style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:3px;">Position, taille, contenu et style de chaque élément</li>
          <li style="font-size:13.5px;color:#444;line-height:1.65;">Les groupes de widgets</li>
        </ul>
        <div style="background:#eef7ff;border-left:4px solid #2B7FFF;border-radius:0 8px 8px 0;padding:10px 14px;font-size:12.5px;color:#1a4d8f;margin:10px 0 14px 0;">💡 Exportez régulièrement. Si vous videz le cache du navigateur, vous ne perdrez rien.</div>
        <div style="background:#e8f5e9;border-left:4px solid #4caf50;border-radius:0 8px 8px 0;padding:10px 14px;font-size:12.5px;color:#2e7d32;margin:10px 0;">✅ Les fichiers PDF sont <strong>sauvegardés automatiquement</strong>. <em>Les fichiers &gt;5 Mo peuvent ne pas l'être selon la capacité du navigateur.</em></div>
      </div>

      <!-- ANNULER / REFAIRE -->
      <div id="h-undoredo" class="help-section">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">↩ Annuler &amp; Refaire</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:14px;">Boutons <strong>↩ ↪</strong> en bas de la rubrique Système. Historique de <strong>60 états</strong> par session.</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Bouton</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Action</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Condition</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;font-weight:700;">↩ Annuler</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Revient à l'état précédent</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Grisé si rien à annuler</td></tr>
          <tr><td style="padding:8px 12px;font-weight:700;">↪ Refaire</td><td style="padding:8px 12px;color:#444;">Rétablit l'action annulée</td><td style="padding:8px 12px;color:#444;">Grisé si rien à refaire</td></tr>
        </table>
        <div style="background:#eef7ff;border-left:4px solid #2B7FFF;border-radius:0 8px 8px 0;padding:10px 14px;font-size:12.5px;color:#1a4d8f;margin:10px 0 14px 0;">💡 Les modifications de texte sont enregistrées après 800 ms d'inactivité.</div>
        <div style="background:#fff8e6;border-left:4px solid #f39c12;border-radius:0 8px 8px 0;padding:10px 14px;font-size:12.5px;color:#7a5000;margin:10px 0;">⚠️ L'historique est perdu si vous fermez ou rechargez la page. Exportez régulièrement avec 💾.</div>
      </div>

      <!-- OPTIONS AVANCÉES -->
      <div id="h-avance" class="help-section">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">⚙️ Options &amp; Fonctionnalités avancées</div>
        <div style="font-size:0.97em;font-weight:700;color:#2B7FFF;margin:0 0 8px 0;">🗓️ Widget Planning — détail</div>
        <ul style="padding-left:20px;margin-bottom:14px;">
          <li style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:3px;">Cliquez sur une heure ou un texte pour l'éditer directement.</li>
          <li style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:3px;">Glissez une ligne par sa poignée <strong>⋮⋮</strong> pour réordonner les créneaux.</li>
          <li style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:3px;">Bouton <strong>＋</strong> dans le widget pour ajouter un créneau, <strong>×</strong> pour en supprimer un.</li>
        </ul>
        <div style="font-size:0.97em;font-weight:700;color:#2B7FFF;margin:18px 0 8px 0;">🖼️ Fond transparent d'un widget</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:10px;">Menu contextuel ☰ → <em>Fond transparent</em>. Le contenu flotte directement sur le bureau sans cadre blanc.</p>
        <div style="font-size:0.97em;font-weight:700;color:#2B7FFF;margin:18px 0 8px 0;">📋 Dupliquer un widget</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:10px;">Menu contextuel ☰ → <em>Dupliquer</em>. La copie est placée légèrement décalée et conserve tout le contenu.</p>
      </div>

      <!-- SCÈNES -->
      <div id="h-scenes" class="help-section">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">🗂️ Scènes</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:10px;">Plusieurs bureaux indépendants dans un seul fichier. Accédez via <strong>＋ → Système → Affichage → Scènes</strong>.</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Action</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Comment</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Changer de scène</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Cliquez sur son nom dans le sous-menu Scènes</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Créer une scène</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Bouton <strong>＋ Nouvelle scène</strong> en bas du sous-menu</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Renommer</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Cliquez sur le nom de la scène dans la liste</td></tr>
          <tr><td style="padding:8px 12px;">Supprimer</td><td style="padding:8px 12px;color:#444;">Icône 🗑️ à droite (impossible si c'est la seule scène)</td></tr>
        </table>
        <div style="background:#eef7ff;border-left:4px solid #2B7FFF;border-radius:0 8px 8px 0;padding:12px 16px;font-size:12.5px;color:#1a4d8f;margin:16px 0;">
          💡 <strong>Idées d'organisation :</strong><br><br>
          • <strong>Scène 1 — Matin</strong> : accueil, date, planning de la journée<br>
          • <strong>Scène 2 — Maths</strong> : leçon du jour, exercices, timer<br>
          • <strong>Scène 3 — Lecture</strong> : texte affiché, questions, vocabulaire<br>
          • <strong>Scène 4 — Fin de journée</strong> : devoirs, récap, YouTube
        </div>
        <div style="background:#fff8e6;border-left:4px solid #f39c12;border-radius:0 8px 8px 0;padding:10px 14px;font-size:12.5px;color:#7a5000;margin:10px 0;">⚠️ Stockées dans le localStorage. Exportez en .json avant de vider le cache ou changer de navigateur.</div>
      </div>

      <!-- POINTEUR LASER -->
      <div id="h-laser" class="help-section">
        <div style="font-size:1.15em;font-weight:800;color:#1a1a2e;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e8ee;">🔴 Pointeur laser</div>
        <p style="font-size:13.5px;color:#444;line-height:1.65;margin-bottom:10px;">Activez via <strong>＋ → Système → Affichage → Pointeur laser</strong>. Le curseur est remplacé par un <strong>point rouge lumineux</strong>.</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
          <tr><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Action</th><th style="background:#f0f3f9;text-align:left;padding:8px 12px;font-weight:700;border-bottom:2px solid #dde2ea;">Résultat</th></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Clic sur 🔴 dans Affichage</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Active le pointeur</td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;">Re-clic sur 🔴</td><td style="padding:8px 12px;border-bottom:1px solid #eef0f3;color:#444;">Désactive le pointeur</td></tr>
          <tr><td style="padding:8px 12px;">Touche <strong>Échap</strong></td><td style="padding:8px 12px;color:#444;">Désactive en urgence</td></tr>
        </table>
        <div style="background:#eef7ff;border-left:4px solid #2B7FFF;border-radius:0 8px 8px 0;padding:10px 14px;font-size:12.5px;color:#1a4d8f;margin:10px 0;">💡 Activez le laser juste avant de projeter. Les élèves ne verront que le point rouge, sans le curseur système souvent peu visible sur vidéoprojecteur.</div>
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

  // ── Injection du CSS ──────────────────────────────────────────────────
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
  `;
  document.head.appendChild(style);

  // Injection dans le body
  document.body.insertAdjacentHTML('beforeend', html);

  // Fermer en cliquant sur l'overlay
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
