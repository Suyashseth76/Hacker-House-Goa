// Master Crew Frame Generator for Hacker House Goa 2026
// Uses official master template crew-master-template-clean.jpg (1024 x 989 px)

const canvas = document.getElementById('crew-canvas');
const ctx = canvas.getContext('2d');

const form = document.getElementById('crew-form');
const teamNameInput = document.getElementById('crewTeamName');
const downloadBtn = document.getElementById('download-crew');
const shareBtn = document.getElementById('share-crew');
const errorEl = document.getElementById('crew-error');

// Load clean master template background image
const templateImg = new Image();
templateImg.src = '/crew-master-template-clean.jpg';
let templateLoaded = false;
templateImg.onload = () => {
  templateLoaded = true;
  renderCrewCanvas();
};

// Store up to 3 loaded member photo images
const memberPhotos = [null, null, null];

// Handle member photo file uploads
document.querySelectorAll('.m-photo').forEach((input) => {
  input.addEventListener('change', (e) => {
    const idx = parseInt(e.target.dataset.index, 10);
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        errorEl.textContent = 'Photo must be 8 MB or smaller.';
        e.target.value = '';
        return;
      }
      errorEl.textContent = '';
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          memberPhotos[idx] = img;
          renderCrewCanvas();
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      memberPhotos[idx] = null;
      renderCrewCanvas();
    }
  });
});

// Re-render canvas on text input changes
[teamNameInput].forEach((el) => {
  el.addEventListener('input', renderCrewCanvas);
});

document.querySelectorAll('.m-name, .m-role, .m-title').forEach((el) => {
  el.addEventListener('input', renderCrewCanvas);
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  renderCrewCanvas();
});

function getActiveMembers() {
  const nameInputs = document.querySelectorAll('.m-name');
  const roleInputs = document.querySelectorAll('.m-role');
  const titleInputs = document.querySelectorAll('.m-title');
  const members = [];

  nameInputs.forEach((nEl, i) => {
    if (i >= 3) return; // Maximum 3 members
    const name = nEl.value.trim();
    const role = roleInputs[i]?.value.trim() || '';
    const title = titleInputs[i]?.value.trim() || '';
    if (name || role || memberPhotos[i]) {
      members.push({
        index: i,
        name: name || `TEAMMATE ${i + 1}`,
        role: role || 'ROLE / STACK',
        title: title || ''
      });
    }
  });

  return members.length > 0 ? members.slice(0, 3) : [
    {
      index: 0,
      name: 'ALEX RIVERA',
      role: 'FULLSTACK / RUST',
      title: '“Captain Hacker”'
    },
    {
      index: 1,
      name: 'SAM CHEN',
      role: 'AI / PYTHON',
      title: '“Neural Architect”'
    },
    {
      index: 2,
      name: 'PRIYA SHARMA',
      role: 'UI/UX / DESIGN',
      title: '“Design Alchemist”'
    }
  ];
}

function renderCrewCanvas() {
  if (!templateLoaded) return;

  const w = canvas.width; // 1024
  const h = canvas.height; // 989

  // 1. Draw Clean Master Template Background Image (Seamless background across entire canvas)
  ctx.drawImage(templateImg, 0, 0, w, h);

  // 2. Render Enlarged Top Header: HACKER HOUSE GOA (36px font)
  drawHeaderTitle(ctx, w);

  const activeMembers = getActiveMembers();
  const count = activeMembers.length;

  // Calculate layout coordinates for 1, 2, or 3 members
  const memberCoords = getMemberCoordinates(count, w);

  // 3. Render each member (Photo circle + Beach Avatar / Photo + Decorative Rings + Text labels)
  activeMembers.forEach((member, i) => {
    const coords = memberCoords[i];
    const photoImg = memberPhotos[member.index];

    drawMemberFrame(ctx, coords.x, coords.y, coords.radius, photoImg, member);
  });

  // 4. Render Enlarged TEAM label and Team Name (No brackets)
  drawTeamName(ctx, w, h);
}

function drawHeaderTitle(ctx, canvasWidth) {
  const centerX = canvasWidth / 2;
  const topY = 165;

  // Render "HACKER HOUSE GOA" enlarged header text
  ctx.fillStyle = '#143324';
  ctx.font = '900 36px Georgia, "Times New Roman", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('HACKER HOUSE GOA', centerX, topY);

  // Render decorative dashed accent line underneath
  ctx.save();
  ctx.setLineDash([7, 5]);
  ctx.strokeStyle = '#c02640';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(centerX - 182, topY + 17);
  ctx.lineTo(centerX + 182, topY + 17);
  ctx.stroke();
  ctx.restore();
}

function getMemberCoordinates(count, canvasWidth) {
  if (count === 1) {
    // 1 Member: Single large circle (r=130) perfectly centered
    return [{ x: canvasWidth / 2, y: 390, radius: 130 }];
  } else if (count === 2) {
    // 2 Members: 2 large circles (r=108) side-by-side filling the space appropriately
    return [
      { x: 370, y: 395, radius: 108 },
      { x: 654, y: 395, radius: 108 }
    ];
  } else {
    // 3 Members: 2 circles on top row (r=82), 1 circle centered on bottom row (r=82)
    return [
      { x: 380, y: 285, radius: 82 }, // Member 1 (Top Left)
      { x: 644, y: 285, radius: 82 }, // Member 2 (Top Right)
      { x: 512, y: 525, radius: 82 }  // Member 3 (Bottom Center)
    ];
  }
}

function drawMemberFrame(ctx, centerX, centerY, radius, photoImg, member) {
  // Circle clipping for avatar image / beach background
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);

  if (photoImg) {
    ctx.fillStyle = '#f7eedd';
    ctx.fill();
    ctx.clip();
    const aspect = photoImg.width / photoImg.height;
    let drawW, drawH, drawX, drawY;
    if (aspect > 1) {
      drawH = radius * 2;
      drawW = radius * 2 * aspect;
      drawX = centerX - drawW / 2;
      drawY = centerY - radius;
    } else {
      drawW = radius * 2;
      drawH = (radius * 2) / aspect;
      drawX = centerX - radius;
      drawY = centerY - drawH / 2;
    }
    ctx.drawImage(photoImg, drawX, drawY, drawW, drawH);
  } else {
    // Render Beach Sunset Background inside circle when no photo uploaded
    ctx.clip();

    // 1. Sky & Sea Sunset Linear Gradient
    const grad = ctx.createLinearGradient(centerX, centerY - radius, centerX, centerY + radius);
    grad.addColorStop(0, '#f4a261');    // warm orange sky
    grad.addColorStop(0.45, '#e76f51'); // coral sunset
    grad.addColorStop(0.7, '#2a9d8f');  // turquoise sea
    grad.addColorStop(1, '#1d3557');    // deep ocean navy
    ctx.fillStyle = grad;
    ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);

    // 2. Setting Sun disc
    ctx.beginPath();
    ctx.arc(centerX, centerY - radius * 0.15, radius * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 230, 167, 0.88)';
    ctx.fill();

    // 3. Palm Tree Silhouette Accents
    ctx.beginPath();
    ctx.moveTo(centerX, centerY + radius * 0.45);
    ctx.quadraticCurveTo(centerX - radius * 0.2, centerY + radius * 0.1, centerX - radius * 0.4, centerY + radius * 0.15);
    ctx.quadraticCurveTo(centerX - radius * 0.1, centerY + radius * 0.2, centerX, centerY + radius * 0.45);
    ctx.fillStyle = 'rgba(20, 51, 36, 0.55)';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(centerX, centerY + radius * 0.45);
    ctx.quadraticCurveTo(centerX + radius * 0.2, centerY + radius * 0.05, centerX + radius * 0.4, centerY + radius * 0.12);
    ctx.quadraticCurveTo(centerX + radius * 0.1, centerY + radius * 0.2, centerX, centerY + radius * 0.45);
    ctx.fillStyle = 'rgba(20, 51, 36, 0.55)';
    ctx.fill();

    // 4. Teammate Initials Text over Beach Graphic
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = '#ffffff';
    ctx.font = `900 ${Math.round(radius * 0.46)}px "Trebuchet MS", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const initials = (member.name || 'H')
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
    ctx.fillText(initials || 'HH', centerX, centerY);
    ctx.restore();
  }
  ctx.restore();

  // Multi-Ring Decorative Outer Border (Matching template colors)
  // Outer Green Ring
  ctx.strokeStyle = '#143324';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius + 4, 0, Math.PI * 2);
  ctx.stroke();

  // Inner Gold Accent Ring
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius + 9, 0, Math.PI * 2);
  ctx.stroke();

  // Outer Dotted Crimson Ring
  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = '#c02640';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius + 14, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Basic Info Text Labels underneath circle
  let labelY = centerY + radius + (radius > 100 ? 30 : 25);

  // 1. Teammate Name
  ctx.fillStyle = '#143324';
  const nameFontSize = radius > 120 ? '24px' : (radius > 100 ? '21px' : '17px');
  ctx.font = `900 ${nameFontSize} Georgia, "Times New Roman", serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(member.name.toUpperCase(), centerX, labelY);

  // 2. Role / Stack
  labelY += radius > 100 ? 24 : 19;
  ctx.fillStyle = '#c02640';
  const roleFontSize = radius > 100 ? '13.5px' : '11.5px';
  ctx.font = `700 ${roleFontSize} "Trebuchet MS", sans-serif`;
  ctx.fillText(member.role.toUpperCase(), centerX, labelY);

  // 3. Optional Builder Title
  if (member.title) {
    labelY += radius > 100 ? 20 : 16;
    ctx.fillStyle = '#3a4e43';
    const titleFontSize = radius > 100 ? '12.5px' : '11px';
    ctx.font = `italic bold ${titleFontSize} Georgia, serif`;
    ctx.fillText(member.title, centerX, labelY);
  }
}

function drawTeamName(ctx, canvasWidth, canvasHeight) {
  const teamName = (teamNameInput.value || 'ALPHA BUILDERS').trim().toUpperCase();

  // 1. Draw Enlarged "TEAM" label (20px)
  ctx.fillStyle = '#c02640';
  ctx.font = 'bold 20px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('✦  T E A M  ✦', canvasWidth / 2, 760);

  // 2. Draw Enlarged Team Name (38px, NO BRACKETS)
  ctx.fillStyle = '#143324';
  ctx.font = '900 38px Georgia, "Times New Roman", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(teamName, canvasWidth / 2, 812);
}

// Download Button
downloadBtn.addEventListener('click', () => {
  const teamName = (teamNameInput.value || 'Squad').trim().replace(/[^a-zA-Z0-9]/g, '_');
  const link = document.createElement('a');
  link.download = `${teamName}_HackerHouseGoa_CrewFrame.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
});

// Share Button
shareBtn.addEventListener('click', async () => {
  try {
    canvas.toBlob(async (blob) => {
      const teamName = (teamNameInput.value || 'Squad').trim().replace(/[^a-zA-Z0-9]/g, '_');
      const file = new File([blob], `${teamName}_HackerHouseGoa_CrewFrame.png`, { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `${teamNameInput.value} — Hacker House Goa Crew Frame`,
          text: `Check out our ${teamNameInput.value} squad frame for Hacker House Goa 2026! 🌴⚡`,
          files: [file]
        });
      } else {
        alert('Downloading crew frame image for sharing...');
        downloadBtn.click();
      }
    });
  } catch (err) {
    downloadBtn.click();
  }
});

