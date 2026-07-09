const fs = require('fs');

function replaceInFile(path, replacements) {
  let content = fs.readFileSync(path, 'utf8');
  for (const { from, to } of replacements) {
    content = content.replace(from, to);
  }
  fs.writeFileSync(path, content);
}

replaceInFile('src/components/RootLayout.tsx', [
  { from: 'ILAB', to: 'iLab' },
  { from: 'Ilab', to: 'iLab' },
  { from: 'Aulas Gravadas', to: 'iLab Academy' },
  { from: 'Aulas Gravadas', to: 'iLab Academy' },
  { from: 'to="/aulas"', to: 'to="/academy"' },
  { from: 'isActive("/aulas")', to: 'isActive("/academy")' },
  { from: 'to="/aulas"', to: 'to="/academy"' }
]);

replaceInFile('src/pages/Home.tsx', [
  { from: 'Ranking Ilab', to: 'Ranking iLab' },
  { from: 'Ranking Ilab', to: 'Ranking iLab' },
  { from: 'Ranking Ilab', to: 'Ranking iLab' }
]);

replaceInFile('src/pages/ForumList.tsx', [
  { from: 'Ilab', to: 'iLab' }
]);

replaceInFile('src/pages/Lessons.tsx', [
  { from: 'Aulas <span className="text-fox">Gravadas</span>', to: 'iLab <span className="text-fox">Academy</span>' },
  { from: 'Ilab Academy', to: 'iLab Academy' }
]);

replaceInFile('src/pages/AdminPanel.tsx', [
  { from: 'Aulas Gravadas', to: 'iLab Academy' }
]);

replaceInFile('src/App.tsx', [
  { from: 'path: "aulas",', to: 'path: "academy",' }
]);

console.log("Renamed things successfully.");
