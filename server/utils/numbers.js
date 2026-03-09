let numbers = [];

function getNumber(index) {

    if (index >= numbers.length) {
        numbers.push(Math.floor(Math.random() * 6) + 1);
    }

    return numbers[index];
}

module.exports = { getNumber };