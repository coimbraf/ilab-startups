fetch('https://corsproxy.io/?' + encodeURIComponent('https://www.youtube.com/watch?v=dQw4w9WgXcQ'))
.then(res => res.text())
.then(html => {
  const match = html.match(/itemprop="duration" content="(PT.*?)"/);
  console.log(match ? match[1] : 'not found');
})
.catch(err => console.error(err.message))
