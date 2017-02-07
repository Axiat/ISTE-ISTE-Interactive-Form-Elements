/*jshint esversion: 6 */



function createElements(text) {
    "use strict";
    const text_array = text;
    const div = document.createElement("div");
    div.className = "question-wrapper";
    const arrayLenth = text_array.length;


    /* Iterate over input and create dictionary */
    const dict = [];
    const used_elements = []; // keps track of elements
    for( let i = 0; i < arrayLenth; i++ ){
        const line = text_array[i];
        if (!line.includes("//") && line.length > 0){ // ignore all commented out lines and empty lines
            const parsed_line = line.split("|");
            const element = parsed_line[0].trim();
            const parent = parsed_line[1].trim();

            let new_question;
            if(element.includes(":")){      // if an alias is assigned to a question
                let parsed = element.split(":");
                const id = parsed[0].trim();
                const question = parsed[1].trim();
                new_question = new createQuestion(id,question,parent);
            }
            else{
                new_question = new createQuestion("",element,parent);
            }

            const curr_question = new_question.question;
            const curr_parent = new_question.parent;

            if(used_elements[curr_question ] !== true && !new_question.isEqual(parent) ){ // ensures each node only has one parent

                used_elements[curr_question] = true; // mark new element as used
                if( dict[curr_parent] === undefined  ){ // if the parent is not already recorded
                    dict[curr_parent] = [new_question];
                }
                else{                               // update key if parent is listed
                    const old_vals = dict[curr_parent];
                    dict[curr_parent] = [new_question].concat(old_vals);
                }
            }

        }
    }


    /* Iterate over keys in dictionary to help build the page */
    for( const key in dict ){
        let line = key + " --> ";
        const array_of_questions = dict[key];

        for(const index in array_of_questions){
            line += (array_of_questions[index].question) + ", ";
        }

        const p = document.createElement("p");
        p.appendChild(  document.createTextNode(line)   );
        div.appendChild(p);
    }

    document.getElementById("content").appendChild(div);
}


function createQuestion(id, question, parent){
    "use strict";
    this.id = id;
    this.question = question;
    this.parent = parent;

    this.isEqual = function (input) {
        return (input === id || input === question);
    };

}



/**
 * This function takes in the path of a input file and passes the entire
 * text as an array of strings to the "createElements" function.
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
                createElements(allText.split("\n"));
            }
        }
    };
    rawFile.send(null);
}


readTextFile("input.txt");

