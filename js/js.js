const config = {
	apiKey: "AIzaSyBLkcUrLVrrFgXh4OlyHmBgErH9qj7YNmc",
    authDomain: "gamehistory.firebaseapp.com",
    databaseURL: "https://gamehistory.firebaseio.com",
    projectId: "gamehistory",
    storageBucket: "gamehistory.appspot.com",
    messagingSenderId: "423729250313",
    appId: "1:423729250313:web:24cd82e89d6406a4e4f8d8",
    measurementId: "G-P1V1C757NW"
}
firebase.initializeApp(config);
firebase.analytics();

const firestore = firebase.firestore();

const posts = document.querySelector('#posts')
const createForm = document.querySelector('#createForm');
const progressBar = document.querySelector('#progressBar');
const progressHandler = document.querySelector('#progressHandler');
const postSubmit = document.querySelector('#postSubmit');

const getPosts = async() => {
	let	postsArray = [];
	let docs = await firebase.firestore().collection('posts').get().catch(err => console.log(err));
	docs.forEach(doc => {
		postsArray.push({'id': doc.id, 'data': doc.data()});
	});

	createChildren(postsArray);
}
const createChildren = async(arr) =>{
	if (posts != null) {
		arr.map( post =>{
			let div = document.createElement('div');
			let cover = document.createElement('a');
			let anchor = document.createElement('div');
			let anchorNode = document.createTextNode(post.data.title);
			cover.setAttribute('href', 'index.html' );
			// cover.setAttribute('href', 'index.html');
			// anchor.setAttribute('href', 'post.html#/' + post.id);

			anchor.appendChild(anchorNode);
			cover.style.backgroundImage = 'url(' + post.data.cover + ')';
			div.classList.add('post');
			div.appendChild(cover);
			div.appendChild(anchor);
			posts.appendChild(div);
		});
	}
}

if (createForm != null) {
	let d;
	createForm.addEventListener('submit', async(e) =>{
		e.preventDefault();

		if (document.getElementById('title').value !='' && document.getElementById('content').value  !='' && document.getElementById('cover').files[0] !=''){

			let title = document.getElementById('title').value;
			let content = document.getElementById('content').value;
			let cover = document.getElementById('cover').files[0];
			console.log(cover);

			const storageRef = firebase.storage().ref();
			const storageChild = storageRef.child(cover.name);

			console.log('Uploading file...');
			const postCover = storageChild.put(cover);

			await new Promise((resolve) =>{
				postCover.on('state_changed', (snapshot) => {
					let progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
					console.log(Math.trunc(progress));

					if (progressHandler != null){
						progressHandler.style.display = true;
					}
					if (postSubmit != null) {
						postSubmit.disabled = true;
					}
					if (progressBar != null) {
						progressBar.value = progress;
					}	
				}, (error)=> {
					//error
					console.log(error)
				}, async() => {
					const downloadURL = await storageChild.getDownloadURL(); 
					d = downloadURL;
					console.log(d);
					resolve();
				});
			});

			const fileRef = await firebase.storage().refFromURL(d);
			let post = {
				title,
				content,
				cover: d,
				fileref: fileRef.location.path
			}

			await firebase.firestore().collection('posts').doc(title).set(post);
			console.log('post was succesful');

			if (postSubmit != null){
				window.location.replace('../index.html');
				postSubmit.disabled = false;
			}
		}else{
			console.log('fill imputs');
		}

	});
}

//check DOM
document.addEventListener('DOMContentLoaded', (e) => {
	getPosts();
});
