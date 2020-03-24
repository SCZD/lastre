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
const loading = document.querySelector('#loading');
const editButton = document.querySelector('#edit');
const deleteButton = document.querySelector('#delete');
const singlePost = document.querySelector('#post');
const editFormContainer = document.querySelector('#editFormContainer');

let editMode = false;

const getPosts = async() => {
	let	postsArray = [];
	let docs = await firebase.firestore().collection('posts').get().catch(err => console.log(err));
	docs.forEach(doc => {
		postsArray.push({'id': doc.id, 'data': doc.data()});
	});

	createChildren(postsArray);
}

const getPost = async() => {

	let postId = getPostIdFromURL();
	if(loading != null){
		loading.innerHTML = '<div class="lds-ellipsis"><div></div><div></div><div></div><div></div><p></p></div>';
	}

	let post = await firebase.firestore().collection('posts').doc(postId).get().catch(err => console.log(err));

	if (loading != null) {
		loading.innerHTML = '';
	}

	if (post && deleteButton != null) {
		deleteButton.style.display = 'block';
	}

	if (post && editButton != null) {
		editButton.style.display = 'block';
	}

	createChild(post.data());

}

const createChild = (postData) =>{
	if (singlePost !== null) {

		let div = document.createElement('div');
		let infodiv = document.createElement('div');
		let img = document.createElement('img');
		img.setAttribute('src', postData.cover);
		img.setAttribute('loading', 'lazy');

		let title = document.createElement('h3');
		let titleNode = document.createTextNode(postData.title);
		title.appendChild(titleNode);

		let content = document.createElement('div');
		let contentNode = document.createTextNode(postData.content);
		content.appendChild(contentNode);

		div.appendChild(img);
		infodiv.appendChild(title);
		infodiv.appendChild(content);
		div.appendChild(infodiv);

		post.appendChild(div);
	}
}

const getPostIdFromURL = () => {
	let postLocation = window.location.href;
	let hrefArray = postLocation.split('/');
	let postIdURL = hrefArray.slice(-1).pop();
	let postId = postIdURL.replace(/%20/g," ");
    
    return postId;
}

const createChildren = async(arr) =>{
	if (posts != null) {
		arr.map( post =>{
			let div = document.createElement('div');
			let cover = document.createElement('a');
			let anchor = document.createElement('div');
			let anchorNode = document.createTextNode(post.data.title);
			// cover.setAttribute('href', 'index.html' );
			// cover.setAttribute('href', 'index.html');
			cover.setAttribute('href', 'html/postinside.html#/' + post.id);

			anchor.appendChild(anchorNode);
			cover.style.backgroundImage = 'url(' + post.data.cover + ')';
			div.classList.add('post');
			div.appendChild(cover);
			div.appendChild(anchor);
			posts.appendChild(div);
		});
	}
}




if(editButton != null){
	editButton.addEventListener('click',() =>{
		if (editMode == false) {
			editMode = true;
			console.log('enabling edit mode');
			appendEditForm();
		}else{
			editMode = false;
			console.log('disaling edit mode');
			removeEditForm();
		}
	})
}

const removeEditForm = () => {
	let editForm = document.getElementById('editForm');
	editFormContainer.removeChild(editForm);
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
					alert("Pls Auth...");
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
			console.log('fill inputs');
			alert('Fill inputs :)');
		}

	});
}




if(deleteButton !== null){
	deleteButton.addEventListener('click', async() =>{

		const postId = getPostIdFromURL();
		let post = await firebase.firestore().collection('posts').doc(postId).get().catch(err => console.log(err));

		const storageRef = firebase.storage().ref();
		await storageRef.child(post.data().fileref).delete().catch(err => console.log(err), alert('Pls Auth...'));

		await firebase.firestore().collection('posts').doc(postId).delete();
		window.location.replace('../index.html');

	});
}
const appendEditForm = async() => {
	let postId = getPostIdFromURL();
	let post = await firebase.firestore().collection('posts').doc(postId).get().catch(err => console.log(err + 'here not'));
	let d;

	let form = document.createElement('form');
	form.setAttribute('method', 'POST');
	form.setAttribute('id', 'editForm');

	let titleInput = document.createElement('input');
	titleInput.setAttribute('value', post.data().title);
	titleInput.setAttribute('id','editTitle');

	let contentTextarea = document.createElement('textarea');
	contentTextarea.setAttribute('id','editContent');

	let coverFile = document.createElement('input');
	coverFile.setAttribute('type', 'file');
	coverFile.setAttribute('id','editCover');

	let oldCover = document.createElement('input');
	oldCover.setAttribute('type','hidden');
	oldCover.setAttribute('id','oldCover');

	let submit = document.createElement('input');
	submit.setAttribute('value','Update Post');
	submit.setAttribute('type','submit');
	submit.setAttribute('id','editSubmit');


	form.appendChild(titleInput);
	form.appendChild(contentTextarea);
	form.appendChild(coverFile);
	form.appendChild(oldCover);
	form.appendChild(submit);
	editFormContainer.appendChild(form);

	document.getElementById('editContent').value = post.data().content;
	document.getElementById('oldCover').value = post.data().fileref;

	document.querySelector('#editForm').addEventListener('submit', async(e) => {
		e.preventDefault();
		const postId  = await getPostIdFromURL();



		if (document.getElementById('editTitle').value !='' && document.getElementById('editContent').value !=''){

			if(document.getElementById('editCover').files[0] !== undefined ){
				const cover = document.getElementById('editCover').files[0];
				const storageRef = firebase.storage().ref();
				const storageChild = storageRef.child(cover.name);
				console.log('updating file...');

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
				}, (err)=> {
					//error
					console.log(error + 'here not');
				}, async() => {
					const downloadURL = await storageChild.getDownloadURL(); 
					d = downloadURL;
					console.log(d);
					resolve();
					console.log('here not');
				});
			});

			const fileRef = await firebase.storage().refFromURL(d);

			await storageRef.child(document.getElementById('oldCover').value).delete().catch(err => {
				console.log(err + 'here not');

			});
			console.log('Image deleted succesful! :3');

			let post = {
				title: document.getElementById('editTitle').value,
				content: document.getElementById('editContent').value,
				cover: d,
				fileref: fileRef.location.path
			}

			await firebase.firestore().collection('posts').doc(postId).set(post, {merge:true});
			location.reload();

			}else{
				await firebase.firestore().collection('posts').doc(postId).set({
					title: document.getElementById('editTitle').value,
					content: document.getElementById('editContent').value
				},{merge: true});

				location.reload();
			}
		}else{
			console.log('Fill inputs retartd!');
			alert('Fill inputs thx :)');
		}
	}); //!


}
//check DOM
document.addEventListener('DOMContentLoaded', (e) => {
	getPost();
	getPosts();
});



//houdini
function houdini(){
	document.getElementById('izanmagic').style.display = 'flex';
	document.getElementById('houdini').style.display = 'none';
}
function unhoudini(){
	document.getElementById('izanmagic').style.display = 'none';
	document.getElementById('houdini').style.display = 'flex';
}

//login
function ingreso(){
	let email1 = document.getElementById('email').value;
	let contrasena1 = document.getElementById('contrasena').value;

		document.getElementById('izanmagic').style.display = 'none';

	firebase.auth().signInWithEmailAndPassword(email1, contrasena1).catch(function(error) {
  	// Handle Errors here.
  	var errorCode = error.code;
  	var errorMessage = error.message;
  	console.log(errorCode);
  	console.log(errorMessage);
  	document.getElementById('houdini').style.display = 'flex';
  	alert("User, password or both are incorrect :(");
 	 // ...
	});
}

function cerrar(){
	firebase.auth().signOut().then(function() {

	}).catch(function(error) {
 	 // An error happened.
	});
}

function obserdador(){
	firebase.auth().onAuthStateChanged(function(user) {
  		if (user) {
  			console.log('User active');
    		// User is signed in.
    		var displayName = user.displayName;
    		var email = user.email;
    		console.log(email);
    		var emailVerified = user.emailVerified;
    		var photoURL = user.photoURL;
    		var isAnonymous = user.isAnonymous;
    		var uid = user.uid;
    		var providerData = user.providerData;
    		document.getElementById('cerrar').style.display = 'flex';
    		document.getElementById('houdini').style.display = 'none';

    		// ...
  		} else {
    		// User is signed out.
    		// ...
    		console.log('User not active');
    		document.getElementById('cerrar').style.display = 'none';
    		document.getElementById('houdini').style.display = 'flex';
  		}
	});
}
obserdador();

