fetch('https://api.allorigins.win/get?url=' + encodeURIComponent('https://www.youtube.com/watch?v=dQw4w9WgXcQ'))
.then(res => res.json())
.then(data => {
  const html = data.contents;
  const match = html.match(/itemprop="duration" content="(PT[^"]+)"/);
  console.log(match ? match[1] : 'not found');
});
