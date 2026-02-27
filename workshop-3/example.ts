console.log('A')

await new Promise((resolve, reject) => setTimeout(() => {
    console.log('F')
    resolve()
}, 1000))

Promise.reject()
    .then(() => console.log('B'))
    .then(() => console.log('C'))
    .catch(() => console.log('D'))

console.log('E')