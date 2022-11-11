const SESSION_KEY = new Uluru.enc.Hex().decode(new Uluru.Random().fill(new Uint8Array(32)))
let enc_password = ""

function setPass(passw) {
    let padding = "1234567890_NO_MAGIC_NUMBERS_0987654321"
    enc_password = Uluru.encrypt(Uluru.hash(`${padding}:${passw}:${padding}`), SESSION_KEY)
}


function encrypt(plaintext) {
    return Uluru.encrypt(plaintext, Uluru.decrypt(enc_password, SESSION_KEY))
}

function decrypt(ciphertext) {
    return Uluru.decrypt(ciphertext, Uluru.decrypt(enc_password, SESSION_KEY))
}

function str2hex(str) {
    let utf8 = new Uluru.enc.Utf8()
    let hex = new Uluru.enc.Hex()
    return hex.decode(utf8.encode(str))
}

function hex2str(str) {
    let utf8 = new Uluru.enc.Utf8()
    let hex = new Uluru.enc.Hex()
    return utf8.decode(hex.encode(str))
}


async function listNotes() {
    let request = await fetch("/api/v1/list")
    let response = await request.json()

    let notes = []
    response.forEach(item => {
        try {
            notes.push([item, decrypt(hex2str(item))])
        }
        catch {

        }
    });
    return notes
}

async function getNote(id) {
    let request = await fetch("/api/v1/get/" + id)
    let response = await request.text()
    return decrypt(response)
}

async function putNote(id, text) {
    let request = await fetch("/api/v1/post/" + id, {
        method: "POST", body: encrypt(text)
    })
    let response = await request.json()

    return response
}

async function delNote(id) {
    let request = await fetch("/api/v1/del/" + id, {
        method: "DELETE"
    })
    let response = await request.json()

    return response
}

async function populateNotesArea() {
    let area = document.querySelector("#notes")
    let notes = await listNotes()
    area.innerHTML = ""
    notes.forEach(item => {
        area.appendChild(createNoteCardHTML(item[0], item[1]))
    });

    area.innerHTML += '<div class="newnote card" onclick="noteCard_OnClick(this.id)"><p>➕</p></div>'
}

function createNoteCardHTML(id, name) {
    let card = document.createElement("div")
    card.setAttribute("class", "note card")
    card.setAttribute("id", id)
    card.setAttribute("onclick", "noteCard_OnClick(this.id)")

    let figure = document.createElement("figure")

    let img = new Image()
    img.src = "img/note.png"

    let p = document.createElement("p")

    let text = document.createTextNode(name);

    p.appendChild(text)
    figure.appendChild(img)
    card.appendChild(figure)
    card.appendChild(p)

    return card
}


function showPopup(message, show_button) {
    let popup_message = document.querySelector("#popupText")
    popup_message.innerHTML = message

    let close_button = document.querySelector("#btnClosePopup")
    if (show_button) {
        close_button.removeAttribute("style")
    } else {
        close_button.setAttribute("style", "display: none")
    }

    let popup_screen = document.querySelector("#popupscreen")
    popup_screen.removeAttribute("style")
}

function closePopup() {
    let popup_screen = document.querySelector("#popupscreen")
    popup_screen.setAttribute("style", "display: none")
}

function closeEditor() {
    let editor_screen = document.querySelector("#editorscreen")
    editor_screen.setAttribute("style", "display: none")
}

async function frmLogin_OnSubmit() {
    let psw = document.forms["frmLogin"]["password"].value
    if (psw) {
        showPopup("Loading...", false)
        setPass(psw)
        await populateNotesArea()
        document.forms["frmLogin"]["password"].value = ""

        let login_screen = document.querySelector("#loginscreen")
        login_screen.setAttribute("style", "display: none")
        closePopup()
    }
    return false
}

async function noteCard_OnClick(id) {
    showPopup("Loading note...", false)
    let text = ""

    if (id) {
        try {
            text = await getNote(id)
        }
        catch {
            showPopup("Error loading note.", true)
            return
        }
    } else {
        id = ""
    }

    let note_textarea = document.querySelector("#noteText")
    note_textarea.value = text

    let save_button = document.querySelector("#btnSave")
    save_button.setAttribute("onclick", `btnSave_OnClick("${id}")`)

    let delete_button = document.querySelector("#btnDelete")
    delete_button.setAttribute("onclick", `btnDelete_OnClick("${id}")`)

    let editor_screen = document.querySelector("#editorscreen")
    editor_screen.removeAttribute("style")

    closePopup()
}

function btnClose_OnClick() {
    if (confirm("Any changes will be discarded. Are you sure you want to close the editor?")) {
        closeEditor()
    }
}

async function btnSave_OnClick(id) {
    if (!id) {
        let note_name = prompt("Note name:", "")

        if (!note_name) { return }
        if (note_name.length > 20) {
            showPopup("The name can't be larger than 20 characters.", true)
            return
        }
        id = str2hex(encrypt(note_name))
    }
    showPopup("Saving note...", false)

    let note_textarea = document.querySelector("#noteText")
    await putNote(id, note_textarea.value)
    await populateNotesArea()
    closeEditor()
    note_textarea.value = ""
    closePopup()
}

async function btnDelete_OnClick(id) {
    if (!id) { return }

    if (confirm("Are you sure you want to delete this note?")) {
        showPopup("Deleting note...", false)

        try {
            await delNote(id)
        } catch {
            showPopup("Error deleting note.", true)
        }

        await populateNotesArea()
        closeEditor()
        let note_textarea = document.querySelector("#noteText")
        note_textarea.value = ""
        closePopup()
    }
}






