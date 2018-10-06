contract Harberger{

	constructor() public { 
		owner = msg.sender; 
	}
    address owner;

	address commons;
	uint256 timeLimit; // number of blocks auction will stay last before resetting to 0;
	uint256 minBid;

	struct ID {
		string color;
		uint256 value;
		uint256 lastUpdate;
	};

	mapping (uint[2] => ID) pixels;

	event Paint(uint[2] ID, hex Color, uint256 Value);

	modifier onlyOwner {
        require(msg.sender == owner);
        _;
    };

	function paintPixel(uint[2] _id, hex _color, uint256 _value) returns(uint256 cost){
        require(_value > minBid);
        bool expired = (block.number - pixels[_id].lastUpdate) >= timeLimit;
        uint256 cost;

        if(expired == false && pixels[_id].value < _value){
        	cost = _value;
        	pixels[_id].value = cost;
        }
        else {
        	cost = minBid;
        	pixels[_id].value = cost;
        };

        pixels[_id].color = _color;
        pixels[_id].lastUpdate = block.number;

        emit Paint(_id, _color, cost);
	};

	function paintPixels(uint256[2][] _ids, hex[] _colors, uint256[] _value) { //add modifier all lengths are the same // add modifier sum[_value] s == msg.send
		uint256 totalValue;

		for (uint256 i = 0; i < _ids.length; i++) {
        	_id = _ids[i];
        	_color = _colors[i];
            _value = _values[i];

            paintPixel(_id, _color, _value) return(cost);
            totalValue += cost;
        }

        commons.send(totalValue);
        msg.sender.send(msg.value - totalValue);
	};

	function changeTimeLimit (uint256 _timeLimit) is onlyOwner {
		timeLimit = _timeLimit;
	};

	function changeMinBid (uint256 _minBid) is onlyOwner {
		minBid = _minBid;
	};

	function changeCommons (address _commons) is onlyOwner {
		commons = _commons;
	};

	function changeOwner (address _owner) is onlyOwner {
		owner = _owner;
	};
}