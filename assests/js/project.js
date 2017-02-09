
/*jshint esversion: 6 */


/**
 * Gets passed int the input file as raw text and builds up the data model.
 * Once complete, this function then calls displayData() function to render the
 * elments on the page.
 * @param text
 */
function buildDataModel(text) {
    "use strict";
    const text_array = text;
    const arrayLenth = text_array.length;

    const dict = [];          // dictionary holds the parent -> [children] relationship
    const used_elements = []; // keps track of used keys in the dictionary
    const aliases = [];       // keeps track of the aliases assigned in the input file


    for( let i = 0; i < arrayLenth; i++ ){
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
                const alias = expression[0];    // grab the alias
                const elem  = expression[1];

                aliases[alias] = elem;      // associate the question with the alias
                element = elem;
            }
            else {
                element = parsed_line[0].trim();
            }


            /**
             * check to see if the parent is an alias or just a normal question
             */
            if(aliases[parent] !== undefined){  // if the parent IS an alias
                const elem = aliases[parent];
                parent = elem;   // grab the question related to the alias and set the parent equal to it.
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

        }
    }

    displayData(dict);      // now that the data model is complete, lest display the elments

}


/**
 * Gets pased the dictionary, which is our datamodel. We then create each element
 * dynamically and display it on the page.
 * @param dict
 */
function displayData(dict) {
    "use strict";
    const model = dict;

    // html elements
    const div = document.createElement("div");

    // html element styles
    div.className = "question-wrapper";


    /* Iterate over keys in dictionary to help build the page */
    for( const key in model ){

        // create label and assign css class
        const label  = document.createElement("label");
        label.appendChild(  document.createTextNode( key ) );
        label.className = "question-label";


        // Iterate through each questions possible choices and append them to the selectList object.
        const children = model[key];
        const selectList = document.createElement("select");

        for (const index in children) {
            const option = document.createElement("option");
            option.appendChild( document.createTextNode(children[index]) );
            selectList.appendChild(option);
        }

        /**
         * Append the new label and subquestions to the div
         */
        div.appendChild(label);
        div.appendChild(selectList);
    }

    document.getElementById("content").appendChild(div);   // add the new div to the page

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