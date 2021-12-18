import { useState, useRef } from "react";
import { createUseStyles } from "react-jss";
import classnames from "classnames";
import Convertor from "./Convertor";
import font from "./font.json";

const useStyles = createUseStyles({
  App: {
    fontFamily: "Courier New",
  },
  container: {
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    flexDirection: "column",
  },
  led: {
    height: 40,
    width: 40,
    border: "1px solid black",
    margin: 2,
    background: "#fff",
  },
  strip: {
    display: "flex",
    margin: 2,
  },
  pre: {
    whiteSpace: "normal",
  },
  delayInput: {
    width: 60,
    marginTop: 8,
  },
  frameButton: {},
  activeFrameButton: {
    background: "#000",
    color: "#fff",
  },
  controls: {
    "& button": {
      margin: "4px 4px 4px 0px",
    },
  },
  frameList: {
    marginTop: 8,
    marginBottom: 4,
  },
  paletteContainer: {
    marginTop: 8,
    marginBottom: 8,
    display: "flex",
    alignItems: "center",
  },
  colorInput: {
    height: 20,
    width: 20,
    marginRight: 8,
  },
  paletteItem: {
    height: 20,
    width: 20,
    marginRight: 8,
    borderRadius: "50%",
  },
  addColorButton: {
    marginRight: 8,
    height: 24,
  },
});

const ROWS = 8;
const COLUMNS = 8;

export const getLedNumberByXY = (x: number, y: number) => {
  const total = COLUMNS * ROWS;
  const ledNumber = total - (COLUMNS * (y + 1) - x);
  const reversed = ledNumber + (COLUMNS - 1) - 2 * x;
  return y % 2 === 0 ? reversed : ledNumber;
};

const getDefaultGrid = (
  activeLedNumbers: number[] = [],
  defaultColor = "#ff0000"
) => {
  return Array(ROWS)
    .fill([])
    .map((_, row) => {
      const leds = Array(COLUMNS)
        .fill({})
        .map((_, col) => {
          const led = getLedNumberByXY(col, row);
          const on = activeLedNumbers?.includes(led);
          return {
            on,
            color: defaultColor,
            led,
          };
        });
      return leds;
    });
};

const getDefaultFrame = () => {
  return {
    wait: 1000,
    pattern: getDefaultGrid(),
  };
};

const getActiveLedsFromPattern = (pattern: any[]) => {
  return pattern
    .reduce((acc, val) => acc.concat(val), [])
    .filter((led: any) => led.on)
    .map((led: any) => led.led)
    .sort((a: number, b: number) => a - b);
};

const getPatternFromActiveLeds = (
  activeLedNumbers: number[],
  color?: string
) => {
  return getDefaultGrid(activeLedNumbers, color);
};

console.log(font);
type Led = [key: number, r: number, g: number, b: number];

const hexToRgb = (hex: string) => {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const replaced = hex.replace(shorthandRegex, (m, r, g, b) => {
    return r + r + g + g + b + b;
  });

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(replaced);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

export default function App() {
  const classes = useStyles();
  const [activeColor, setActiveColor] = useState("#FF00AE");
  const [palette, setPalette] = useState<string[]>([]);
  const [frameNumber, setFrameNumber] = useState(0);
  const [animation, setAnimation] = useState([getDefaultFrame()]);
  const [delay, setDelay] = useState(100);
  const [playing, setPlaying] = useState(false);
  // const [loopMode, setLoopMode] = useState(true);
  const interval = useRef<ReturnType<typeof setTimeout>>();
  const frameNumberRef = useRef(frameNumber);
  const [showArduinoCode, setShowArduinoCode] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleLedClick = (x: number, y: number, on: boolean) => {
    const state = !on;
    const newAnimation = [...animation];
    newAnimation[frameNumber].pattern[y][x].on = state;
    newAnimation[frameNumber].pattern[y][x].color = activeColor;
    setAnimation(newAnimation);
  };

  const handleChangeFrameLength = (e: React.ChangeEvent<HTMLInputElement>) => {
    const delay = Number(e.target.value);
    if (delay >= 0) {
      const newAnimation = [...animation];
      newAnimation[frameNumber].wait = delay;
      setDelay(delay);
    }
  };

  const handleClear = () => {
    const newAnimation = [...animation];
    newAnimation[frameNumber].pattern = getDefaultGrid();
    setAnimation(newAnimation);
  };

  const handleDecode = (pattern: any) => {
    const newAnimation = [...animation];
    newAnimation[frameNumber].pattern = pattern;
    setAnimation(newAnimation);
  };

  const handleDeleteAll = () => {
    setFrameNumber(0);
    setAnimation([getDefaultFrame()]);
  };

  const handleAddFrame = () => {
    setAnimation([...animation, getDefaultFrame()]);
    setFrameNumber(animation.length);
  };

  const handleClone = () => {
    const animationCopy = JSON.parse(JSON.stringify(animation));
    setAnimation([...animationCopy, animation[frameNumber]]);
    setFrameNumber(animation.length);
  };

  const handleDeleteFrame = () => {
    if (animation.length > 1) {
      setFrameNumber(0);
      const filtered = animation.filter((item, index) => index !== frameNumber);
      setAnimation(filtered);
    }
  };

  const animate = (startFrame: number) => {
    frameNumberRef.current = startFrame;
    interval.current = setTimeout(
      () => {
        if (frameNumberRef.current < animation.length - 1) {
          frameNumberRef.current += 1;
        } else {
          frameNumberRef.current = 0;
        }
        setFrameNumber(frameNumberRef.current);
        setDelay(animation[frameNumberRef.current].wait);
        console.log(
          frameNumberRef.current,
          animation.length,
          animation[frameNumberRef.current].wait
        );
        if (interval.current) {
          clearTimeout(interval.current);
        }
        animate(frameNumberRef.current);
      },
      startFrame === -1
        ? 0
        : animation[frameNumberRef.current < 0 ? 0 : frameNumberRef.current]
            .wait
    );
  };

  const handlePlay = () => {
    if (!playing) {
      animate(-1);
      setPlaying(true);
    } else {
      setPlaying(false);
      if (interval.current) {
        clearTimeout(interval.current);
      }
    }
  };

  const findLetter = (e: React.ChangeEvent<HTMLInputElement>) => {
    const letter = e.target.value.toLowerCase();
    if (letter in font) {
      const activeLeds = (font as { [key: string]: number[] })[letter];
      console.log(activeLeds);
      if (activeLeds.length) {
        const newFrame = getDefaultFrame();
        newFrame.pattern = getDefaultGrid(activeLeds, activeColor);
        setAnimation([...animation, newFrame]);
        setFrameNumber(animation.length);
      }
    }
  };

  // TODO
  const transformLedColor = (color: string) => {
    const rgb = hexToRgb(color);
    return [rgb?.r, rgb?.g, rgb?.b];
  };

  const transformDataForArduino = () => {
    const transformedAnimation: any = [];
    animation.forEach((anim) => {
      const frame: any = [];
      anim.pattern.forEach((row) => {
        row.forEach((col) => {
          frame.push([col.on ? col.led : 99, ...transformLedColor(col.color)]);
        });
      });
      // + 1 settings
      const total = COLUMNS * ROWS + 1;
      const settings = [anim.wait / 1000, animation.length, total, 4];
      // setup array - na nulte pozici je delka pole ledek bez settings
      // na druhe pozici je delay framu, zbytek dummy pro dalse meta data
      const frameWithSettings = [settings, ...frame];
      transformedAnimation.push(frameWithSettings);
    });
    const result = `const unsigned char PROGMEM anim[${
      transformedAnimation.length
    }][65][4] = ${JSON.stringify(transformedAnimation)
      .split("[")
      .join("{")
      .split("]")
      .join("}")};`;
    return result;
  };

  return (
    <div className={classes.App}>
      <div className={classes.container}>
        {animation[frameNumber].pattern.map((row, rowIndex) => (
          <div className={classes.strip} key={`strip-row-${rowIndex}`}>
            {row.map((led, colIndex) => (
              <button
                className={classnames(classes.led)}
                key={`led-${rowIndex}${colIndex}`}
                style={{ background: led.on ? led.color : "#fff" }}
                onClick={() => handleLedClick(colIndex, rowIndex, led.on)}
              >
                {colIndex}-{rowIndex} ({led.led})
              </button>
            ))}
          </div>
        ))}
      </div>
      <div className={classes.paletteContainer}>
        <input
          className={classes.colorInput}
          type="color"
          value={activeColor}
          onChange={(e) => setActiveColor(e.target.value)}
        />
        {palette.map((color) => (
          <button
            className={classes.paletteItem}
            style={{ background: color }}
            onClick={() => setActiveColor(color)}
          />
        ))}
        <button
          className={classes.addColorButton}
          onClick={() => setPalette([...palette, activeColor])}
        >
          Add Color
        </button>
        {palette.length > 0 && palette.find((color) => activeColor === color) && (
          <button
            className={classes.addColorButton}
            style={{ border: `2px solid ${activeColor}` }}
            onClick={() =>
              setPalette(palette.filter((color) => color !== activeColor))
            }
          >
            Remove
          </button>
        )}
      </div>
      <div>
        <input
          id="delay"
          className={classes.delayInput}
          type="number"
          step={100}
          value={delay}
          onChange={handleChangeFrameLength}
        />
        ms
      </div>
      <div>
        <div className={classes.frameList}>
          {animation.map((_, i) => (
            <button
              className={classnames(
                classes.frameButton,
                i === frameNumber ? classes.activeFrameButton : ""
              )}
              key={`frameNumbers-${i}`}
              onClick={() => {
                setDelay(animation[i].wait);
                setFrameNumber(i);
              }}
            >
              {i + 1}
            </button>
          ))}
          <button onClick={handleAddFrame}>+</button>
        </div>
        <div className={classes.controls}>
          <div>
            <button onClick={handlePlay}>{playing ? `Pause` : `Play`}</button>
          </div>
          <div>
            <button onClick={handleClone}>Clone Frame</button>
            <button onClick={handleClear}>Clear Frame</button>
            <button onClick={handleDeleteFrame}>Delete Frame</button>
            <button onClick={handleDeleteAll}>Delete All</button>
          </div>
        </div>
      </div>
      <div>
        <div className={classes.controls}>
          <button onClick={() => setShowArduinoCode((prev) => !prev)}>
            {!showArduinoCode ? `Show Arduino Code` : `Hide Arduino Code`}
          </button>
          <button onClick={() => setIsOpen(true)}>Open Editor</button>
          <input type="text" onChange={findLetter} />
        </div>
        {showArduinoCode && (
          <div>
            <textarea
              readOnly
              rows={10}
              cols={50}
              value={transformDataForArduino()}
            />
          </div>
        )}
        <pre>
          {JSON.stringify(
            getActiveLedsFromPattern(animation[frameNumber].pattern)
          )}
        </pre>
      </div>
      {isOpen && (
        <Convertor onClose={() => setIsOpen(false)} onDecode={handleDecode} />
      )}
    </div>
  );
}
