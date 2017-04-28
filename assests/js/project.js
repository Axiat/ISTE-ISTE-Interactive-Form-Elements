/*jshint esversion: 6 */

let dict = {};          // global dictionary holds the parent -> [children] relationship
let pictures = {};      // contains all the picures and the question they are associated with
let messages = {};      // global dictionary which associates each parent to an optional message

const version = 1.0;                // used to tell the program when to use the data from local storage
                                    // and when to re-generate that data due to a different version

/**
 * Gets passed int the input file as raw text and builds up the data model.
 * Once complete, this function then calls displayData() function to render the
 * elments on the page.
 * @param text
 */
function buildDataModel(text) {
    "use strict";
    const text_array = text;
    const array_length = text_array.length;

    const used_elements = []; // keps track of used keys in the dictionary
    const aliases = [];       // keeps track of the aliases assigned in the input file

    const msg_beginning = "text[";  // denotes the syntax used to declare a message
    const msg_end = "]";


    for( let i = 0; i < array_length; i++ ){
        const line = text_array[i];
        if (!line.includes("//") && line.length > 0){ // ignore all commented out lines and empty lines

            const parsed_line = line.split("|");

            let parent = parsed_line[1].trim(); // all questions have a parent.
            let element;

            /**
             * Determine if the given line uses an alias to represent a question
             */
            if(line.includes(":")){
                const expression = parsed_line[0].split(":");
                const alias = expression[0].trim();    // grab the alias
                const elem  = expression[1].trim();

                aliases[alias] = elem;      // associate the question with the alias
                element = elem;
            }
            else {
                element = parsed_line[0].trim();
            }



            // check to see if the parent is an alias or just a normal question
            if(aliases[parent] !== undefined){  // if the parent IS an alias
                const elem = aliases[parent];
                parent = elem.trim();   // grab the question related to the alias and set the parent equal to it.
            }

            /**
             * This next chunk is a basic check with the following logic:
             *     -> check if an entry exists and prevent an element from being its own parent.
             *     -> if it doesn't exist, create it
             *     -> otherwise concatenate the new child to it's list of children.
             */
            if(used_elements[element] !== true && parent !== element){ // ensures each node only has one parent
                used_elements[element] = true; // mark new element as used

                if( dict[parent] === undefined  ){ // if the parent is not already recorded
                    dict[parent] = [element];
                }
                else{                               // update key if parent is listed
                    const old_vals = dict[parent];
                    dict[parent] = old_vals.concat(element);
                }
            }


            // If there are pictures given for this question a
            if(parsed_line.length > 2 && parsed_line[2].length > 0){

                const picture_list = parsed_line[2].trim().split(",");
                const list_length = picture_list.length;

                for( let i=0; i < list_length ; i++ ){
                    const picture_name = picture_list[i].trim();

                    if(pictures[element] === undefined){
                        pictures[element] = [picture_name];
                    }
                    else{
                        const old_val = pictures[element];
                        pictures[element] = old_val.concat(picture_name);
                    }
                }

            }


            // checks if there is a message associated with this question
            if(parsed_line.length > 3 && parsed_line[3].length > 0){
                const raw_message = parsed_line[3].trim();

                // if message is all on one line
                if(raw_message.includes(msg_beginning) && raw_message.includes(msg_end)){

                    // remove "text[" and "]" from the string
                    let parsed_message = raw_message.replace(msg_beginning,"");
                    parsed_message = parsed_message.replace(msg_end,"").trim();

                    // add the parsed message to the dictionary
                    messages[element] = parsed_message;

                }
                // if message is a multi-line message
                else if(raw_message.includes(msg_beginning) && !raw_message.includes(msg_end)){

                    const return_data = buildMultiLineMessage(text_array,array_length,i,msg_beginning,msg_end);
                    const message = return_data[0];
                    const line_number = return_data[1];

                    // update the line number, which essentially skips to the line which
                    // the buildMultiLineMessage() function leaves off at.
                    i = line_number;

                    // add message to the dictionary
                    messages[element] = message;
                }
            }


        }



    }





    localStorage[version] = JSON.stringify([dict,pictures,messages]); // store data the data model in local storage once loaded

    displayFistQuestion(); // as soon as the data model is complete, display the first question
}


/**
 * Resets the content back to the original question
 */
function reset() {
    "use strict";

    const parent = document.getElementById("content");

    let length = parent.childElementCount;

    // delete everything in the div with the id, "content"
    while(parent.lastChild && length > 1){
        parent.removeChild(parent.lastChild);
        length--;
    }

    // reset question id counter
    question_counter = 1;

    // display the first question
    displayFistQuestion();
}


function displayFistQuestion() {
    "use strict";


    const reset_button = document.createElement("button");
    reset_button.appendChild(   document.createTextNode("Restart!")   );
    reset_button.className = "reset-button";
    reset_button.onclick = function () {
        reset();
    };

    const firstQuestion = Object.keys(dict)[0]; // grabs the first element out of the dictionary

    // create container div
    const div = document.createElement("div");
    div.id = "question-content";
    div.className = "question-wrapper";

    //document.getElementById("content").appendChild(name_form);
    document.getElementById("content").appendChild(reset_button);
    document.getElementById("content").appendChild(div);   // add the new div to the page

    displayQuestion(firstQuestion); // once the wrapper is in place, we can start displaying questions
}

/**
 * This function is called whenever the body is loaded
 */
function handleCookies() {
    // if cookie does not exist, the user has not been here before
    "use strict";
    let username  = "custom_user_cookie_id";
    let hit_count = "custom_hit_count";

    let form = document.getElementById("name-form");

    if( GetCookie(username) === null) {


        // The question that is prompted to the user
        const prompt = document.createElement("p");
        prompt.appendChild( document.createTextNode("What is your name?") );


        // the input txt box
        const name_input = document.createElement("input");
        name_input.type = "text";
        name_input.name = "name";

        // submit button in the form
        const submit_button = document.createElement("button");
        submit_button.className = "submit-button";
        submit_button.appendChild( document.createTextNode("Submit") );
        submit_button.onclick = function () {

            if(name_input.value && name_input.value.trim() !== ""){
                SetCookie(username, name_input.value.trim());
                SetCookie(hit_count, '0');

                handleCookies();
            }
            else{
                alert("You forgot to enter your name!");
            }

        };

        // build form
        form.appendChild(prompt);
        form.appendChild(name_input);
        form.appendChild(submit_button);

    }
    // else we ahve a return visior
    else {
        // get the nickname
        let getName = GetCookie(username);
        // get how many visits they have had here
        let getHits = GetCookie(hit_count);
        getHits = parseInt(getHits) + 1;
        // tell them that big brother is tracking them


        form.innerText = "Welcome " + getName + "!, you have visited " + getHits+ " time(s).";
        // Set the cookie with an updated count.
        SetCookie(hit_count,getHits);
    }
}


let question_counter = 1;

function displayQuestion(input) {
    "use strict";

    updateChildQuestions();

    const question = input;

    // create div that holds an individual question
    const question_div = document.createElement("div");
    question_div.className = "question";
    question_div.id = question_counter;

    // append optional message to question
    const msg_div = document.createElement("div");
    msg_div.className = "message";

    // grab the message assigned to this question
    const msg = messages[question];
    if(msg !== undefined) {
        msg_div.appendChild(
            document.createTextNode(msg)
        );
    }

    // generate any pictures associated with this question
    const pic_div = document.createElement("div");
    pic_div.className = "picture-container";
    displayPictures(question,pic_div);

    // create label and assign css class
    const label  = document.createElement("label");
    label.appendChild(  document.createTextNode( question ) );
    label.className = "question-label";

    // apply certain styles if the user selects an option where they die
    if(msg !== undefined && msg.includes("DIED")){
      // if the person "dies" in the game

        question_div.className = "question dead";
        label.className = "question-label dead";
    }
    // if the user survives the game, apply these css styles
    else if(msg !== undefined && msg.includes("SURVIVED")){
        question_div.className = "question survive";
        label.className = "question-label survive";
    }

    // create select and option elements for each child question
    const selectList = document.createElement("select");
    selectList.className = "question-select";

    // set the default choice is blank
    const blank_choice = document.createElement("option");
    blank_choice.disabled = true;
    blank_choice.selected = " ";
    selectList.appendChild( blank_choice );


    const fadein_script = document.createElement("script");
    fadein_script.type = "text/javascript";
    let code = "fadeInLeft(" + question_counter + ");";
    fadein_script.text = code;

    const children = dict[question];

    if(children !== undefined) {
        const length_children = children.length;


        for (let i = 0; i < length_children; i++) {
            const option = document.createElement("option");
            option.className = "question-option";
            option.appendChild(document.createTextNode(children[i].trim()));
            selectList.appendChild(option);
        }

        // recursively call this function to display new questions
        selectList.onchange = function () {
            displayQuestion(selectList.value);
        };

        // Append the new label and subquestions to the div
        question_div.appendChild(label);
        question_div.appendChild(msg_div); // append msg div
        question_div.appendChild(selectList);
        question_div.appendChild(pic_div);
    }
    else{  // if the question has child questions, essentially the last child node in the tree

        question_div.appendChild(label);
        question_div.appendChild(msg_div); // append msg div
        question_div.appendChild(pic_div);
    }

    question_div.appendChild(fadein_script);

    // increment question counter
    question_counter++;

    document.getElementById("question-content").appendChild(question_div);   // add the new div to the page
}


/**
 * Function which takes in the id of the most recently displayed question
 * and fades in the question from the left
 * @param id
 */
function fadeInLeft(id){
    // get the element
    let el = document.getElementById(id);

    // start the div 20px to the left
    let start_position = 20;

    // initialize the question-div's position and properties
    el.style.opacity = 0;
    el.style.display =  "block";
    el.style.position = "relative";
    el.style.right = start_position + "px";

    // call a function to gradually fade in and shift object to the right;
    // the loop executes 20 times
    (function fade() {
        var val = parseFloat(el.style.opacity);
        if (!((val += .05) > 1) && start_position > 0) {
            el.style.opacity = val;
            el.style.right = start_position-- + "px";
            requestAnimationFrame(fade);
        }
    })();
}


/**
 * This function allows a user to go back anywhere in the form and change their answer.
 *
 * After every selection this question is called which deletes any child questions that
 * don't belong on the page
 */
function updateChildQuestions() {
    "use strict";

    let all_questions = document.getElementsByClassName("question");
    let length = all_questions.length;
    let delete_index = -1;

    for( let i = 0; i < length ; i++ ){

        const curr_question = all_questions[i]; // grabs the question name from the label


        let selected = curr_question.children[2].value; // the option selected

        const curr_children = dict[selected]; // get the children of the choice

        if(curr_children !== undefined && all_questions[i+1] !== undefined){ // ignores the blank default option

            const next_question = all_questions[i+1].children[0].textContent; // grab the lable of the question element

            // if the next question is not a child of the current one (ecluding itself)
            if(!curr_children.includes(next_question) && selected !== next_question){
                delete_index = i+1;
                break;
            }

        }
        else{ // delete question regardless, b/c the question was still changed
            delete_index = i+1;
            break;
        }
    }

    // if delete_index is greater than -1 then we know that we found a question
    // doesn't belong on the current page
    if(delete_index > 0) {

        let wrapper = document.getElementById("question-content"); // grab the parent
        let counter = wrapper.childElementCount;    // get the childnode count

        // step backwards from the end of the list up until the delete index
        while(wrapper.lastChild && counter > delete_index){
            wrapper.removeChild(wrapper.lastChild);
            counter--;
        }

    }
}



/**
 * Iterates through the pictures dictionary and displays any and all photos associated with this
 * question
 * @param input
 */
function displayPictures(input, div) {
    "use strict";

    const question = input;
    const picture_array = pictures[question];
    const pic_div = div;

    if(picture_array !== undefined){
        const length = picture_array.length;
        for ( let i = 0; i < length; i++ ) {
            const picture = document.createElement("img");
            picture.src = "assests/images/" + picture_array[i];
            picture.alt = "pic";
            pic_div.appendChild(picture);
        }

    }

}


/**
 * This function is used to parse and build up multi-line messages which can be assigned
 * to a question in the input.txt file
 *
 * @param text_array    -> the file represented as an array of strings
 * @param text_length   -> length of the "text_array"
 * @param line_number   -> the index of the beginning of the multi-line message
 * @param msg_beginning -> the string used to represent the beginning of a multiline message
 * @param msg_end       -> the string used to represent the end of a multiline message
 * @returns {message,line_number} -> returns the message and the line_number that contains the msg_end string
 */
function buildMultiLineMessage(text_array,text_length,line_number, msg_beginning, msg_end) {
    "use strict";
    const msg_beginning_length = msg_beginning.length;
    let raw_message = "";

    for(let i = line_number ; i < text_length ; i++ ){ // iterate over each line

        const line = text_array[i];
        const length = line.length;

        /* we add the length of msg_beginning to the start index, so we start copying after
         * we see the msg_beginning string.
         */
        const start_index = line.indexOf(msg_beginning) + msg_beginning_length;

        for (let k = start_index ; k < length; k++) {   // iterate over each char in the line

            const char = line[k];

            if (char !== msg_end) {   // copy over characters until we hit the msg_end symbol
                raw_message += char;
            }
            else{
                return [raw_message.trim(), i]; // return the message and the line number
            }
        }

    }
}




/**
 * This function takes in the path of a input file and passes the entire
 * text as an array of strings to the "buildDataModel" function.
 * @param file
 */
function readTextFile(file) {
    "use strict";


    // try to read data from local storage if the user has visited page.
    try{
        const result = JSON.parse(localStorage[version]);

        // copy  over data model instead of parsing and building it from the input file
        dict     = result[0];
        pictures = result[1];
        messages = result[2];

        displayFistQuestion(); // display the inital question
    }
    catch(err){  // means there is no data in the local storage or version number is different, so parse file

        const rawFile = new XMLHttpRequest();
        rawFile.open("GET", file, false);
        rawFile.onreadystatechange = function () {
            if(rawFile.readyState === 4) {
                if(rawFile.status === 200 || rawFile.status === 0) {
                    const allText = rawFile.responseText;
                    buildDataModel(allText.split("\n"));
                }
            }
        };
        rawFile.send(null);

    }







}



readTextFile("input.txt");
