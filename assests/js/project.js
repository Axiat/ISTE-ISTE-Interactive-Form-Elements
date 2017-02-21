/*jshint esversion: 6 */

const dict = [];          // global dictionary holds the parent -> [children] relationship
const pictures = [];      // contains all the picures and the question they are associated with
const messages = [];      // global dictionary which associates each parent to an optional message

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

    displayFistQuestion(); // as soon as the data model is complete, display the first question
}




function displayFistQuestion() {
    "use strict";

    const firstQuestion = Object.keys(dict)[0]; // grabs the first element out of the dictionary

    // create container div
    const div = document.createElement("div");
    div.id = "question-content";
    div.className = "question-wrapper";

    document.getElementById("content").appendChild(div);   // add the new div to the page

    displayQuestion(firstQuestion); // once the wrapper is in place, we can start displaying questions
}



function displayQuestion(input) {
    "use strict";

    updateChildQuestions();

    const question = input;

    // create div that holds an individual question
    const question_div = document.createElement("div");
    question_div.className = "question";

    // append optional message to question
    const msg_div = document.createElement("div");
    msg_div.className = "message";
    displayMessage(question,msg_div);

    // generate any pictures associated with this question
    const pic_div = document.createElement("div");
    pic_div.className = "picture-container";
    displayPictures(question,pic_div);

    // create label and assign css class
    const label  = document.createElement("label");
    label.appendChild(  document.createTextNode( question ) );
    label.className = "question-label";


    // create select and option elements for each child question
    const selectList = document.createElement("select");
    selectList.className = "question-select";

    // set the default choice is blank
    const blank_choice = document.createElement("option");
    blank_choice.disabled = true;
    blank_choice.selected = " ";
    selectList.appendChild( blank_choice );

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
        question_div.appendChild(selectList);
    }


    // attach children
    question_div.appendChild(msg_div);
    question_div.appendChild(pic_div);
    document.getElementById("question-content").appendChild(question_div);   // add the new div to the page
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
        const selected = curr_question.children[1].value; // the option selected

        const curr_children = dict[selected]; // get the children of the choice

        if(curr_children !== undefined && all_questions[i+1] !== undefined){ // ignores the blank default option

            const next_question = all_questions[i+1].children[0].textContent; // grab the lable of the question element

            // if the next question is not a child of the current one (ecluding itself)
            if(!curr_children.includes(next_question) && selected !== next_question){
                delete_index = i+1;
                break;
            }

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

    // // remove old photos from previous question
    // const pic_div = document.getElementById("picture-div");
    // while(pic_div.firstChild){
    //     pic_div.removeChild(pic_div.firstChild);
    // }


    //////////////////////////////
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
            //document.getElementById("picture-div").appendChild(picture);
        }

    }

}


function displayMessage(input,div) {
    "use strict";

    // // grab the div element which will display the message
    // const msg_div = document.getElementById("message");
    //
    // // clear old messages
    // while(msg_div.firstChild){
    //     msg_div.removeChild(msg_div.firstChild);
    // }


    //////////////////////////////////////////
    const question = input;
    const msg_div = div;

    // grab the message assigned to this question
    const msg = messages[question];

    // if a message for this question exists
    if(msg !== undefined){
        msg_div.appendChild(
            document.createTextNode(msg)
        );
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



readTextFile("input.txt");
