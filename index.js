const Aria2 = require('aria2')
const { DOWNLOAD_ROOT_DIR } = require('./ARIA_CONFIG')
const express = require('express')
const app = express()
app.use(express.json())

const options = {
    host: 'localhost',
    port: 6800,
    secure: false,
    path: '/jsonrpc',
}

const aria2 = new Aria2({ ...options })

function openWebsocket(callback) {
    aria2
        .open()
        .then(() => {
            callback(null)
        })
        .catch(err => {
            callback(err)
        })
}

function setOnDownloadComplete(callback) {
    aria2.onDownloadComplete = function (keys) {
        callback(keys.gid)
    }
}

function addUri(uri, callback) {
    aria2
        .call('addUri', [uri], { dir: DOWNLOAD_ROOT_DIR })
        .then(gid => {
            callback(null, gid.guid)
        })
        .catch(err => {
            callback(err)
        })
}

function downloadFile(url, cb) {
    addUri(url, (err, gid) => {
        if (err) {
            console.log(err)
            return
        }

        console.log('The file GID', gid)
        cb(gid)
    })
}

function startAria2(cb) {
    openWebsocket(err => {
        if (err) {
            console.log('Error: ARIA2 refuesd to connect')
            process.exit()
        }
        console.log('Aria2 connected')
        cb()
    })

    setOnDownloadComplete(gid => {
        console.log('The file ID', gid)
    })
}

app.post('/', (req, res) => {
    const EXAMPLE_DOWNLOAD_URI =
        'magnet:?xt=urn:btih:88594AAACBDE40EF3E2510C47374EC0AA396C08E&dn=bbb_sunflower_1080p_30fps_normal.mp4&tr=udp%3a%2f%2ftracker.openbittorrent.com%3a80%2fannounce&tr=udp%3a%2f%2ftracker.publicbt.com%3a80%2fannounce&ws=http%3a%2f%2fdistribution.bbb3d.renderfarming.net%2fvideo%2fmp4%2fbbb_sunflower_1080p_30fps_normal.mp4'
    let GID
    downloadFile(EXAMPLE_DOWNLOAD_URI, gid => {
        GID = gid
    })

    res.json({ fileGID: GID })
})

app.listen(3000, () => {
    startAria2(() => {
        console.log(`YAY! Aria2c connected and Server running on PORT 3000`)
    })
})
