import { useState, useEffect, useRef } from "react";
import { createUseStyles } from "react-jss";
import { getLedNumberByXY } from "./App";

const useStyles = createUseStyles({
  container: {
    zIndex: 100,
    position: "absolute",
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    top: 0,
    left: 0
  },
  canvasWrapper: {
    background: "#fafafa",
    boxShadow: "0 2px 2px 2px rgba(0,0,0,0.1)"
  },
  canvas: {}
});

function componentToHex(c: number) {
  const hex = c.toString(16);
  return hex.length === 1 ? "0" + hex : hex;
}

function rgbToHex(r: number, g: number, b: number) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

const Convertor = ({ onClose, onDecode }: any) => {
  const classes = useStyles();
  const fileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<any>();
  const [selPos, setSelPos] = useState({ x: 160, y: 160 });
  const imgRef = useRef<any>(null);
  const [imageData, setImageData] = useState("");
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(false);

  const drawSelector = () => {
    const ctx = ctxRef.current;
    ctx.beginPath();
    ctx.rect(selPos.x, selPos.y, 80, 80);
    ctx.stroke();
  };

  const onImageTransform = ({
    x,
    y,
    s
  }: {
    x: number;
    y: number;
    s: number;
  }) => {
    setLoading(true);
    const img = new Image();
    img.onload = () => {
      const ctx = ctxRef.current;
      const pos = { x: position.x + x, y: position.y + y };
      const scale = { width: size.width + s, height: size.height + s };
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.drawImage(img, pos.x, pos.y, scale.width, scale.height);
      drawSelector();
      setPosition(pos);
      setSize(scale);
      setLoading(false);
      img.remove();
    };
    img.src = imageData;
  };

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    ctxRef.current = canvasRef.current.getContext("2d");
  }, []);

  useEffect(() => {
    const ctx = ctxRef.current;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.beginPath();
    ctx.rect(selPos.x, selPos.y, 80, 80);
    ctx.stroke();
  }, [selPos]);

  // useEffect(() => {
  //   if (!canvasRef.current) {
  //     return;
  //   }
  //   const canvas = canvasRef.current;
  //   const moveContinuous = (e: MouseEvent) => {
  //     console.log(e);

  //     onImageTransform({ x: 1, y: 0, s: 0 });
  //   };
  //   canvas.addEventListener("mousemove", moveContinuous);
  //   return () => canvas.removeEventListener("mousemove", moveContinuous);
  // });

  const onFileLoad = (data: string) => {
    if (!data) {
      return;
    }
    const ctx = ctxRef.current;
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;
      const ratio = width / height;
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.drawImage(img, 0, 0, 400, 400 / ratio);
      drawSelector();
      setSize({ width: 400, height: 400 / ratio });
      img.remove();
    };
    img.src = data;
    setImageData(data);
  };

  const handleLoad = () => {
    const files = fileRef.current?.files;
    const reader = new FileReader();
    if (files?.length) {
      reader.onload = (e) => onFileLoad(e.target?.result as string);
      reader.readAsDataURL(files[0]);
    }
  };

  const handleDecode = () => {
    setLoading(true);
    const img = new Image();
    img.onload = () => {
      const ctx = ctxRef.current;
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.drawImage(img, position.x, position.y, size.width, size.height);
      drawSelector();
      setLoading(false);
      const pattern = [];
      for (let y = 0; y < 8; y += 1) {
        const leds = [];
        for (let x = 0; x < 8; x += 1) {
          const pixel = ctx.getImageData(
            160 + x * 10 + 5,
            160 + y * 10 + 5,
            1,
            1
          );
          leds.push({
            on: true,
            led: getLedNumberByXY(x, y),
            color: rgbToHex(pixel.data[0], pixel.data[1], pixel.data[2])
          });
        }
        pattern.push(leds);
      }
      onClose();
      onDecode(pattern);
      img.remove();
    };
    img.src = imageData;
  };

  return (
    <div className={classes.container}>
      <div className={classes.canvasWrapper}>
        <button onClick={onClose}>Close</button>
        <div>
          <input ref={fileRef} type="file" onChange={handleLoad} />
          <div>
            <canvas
              className={classes.canvasWrapper}
              width={400}
              height={400}
              ref={canvasRef}
            />
          </div>
          <div>
            <button
              disabled={loading}
              onClick={() => onImageTransform({ x: 0, y: 0, s: 1 })}
            >
              +1
            </button>
            <button
              disabled={loading}
              onClick={() => onImageTransform({ x: 0, y: 0, s: -1 })}
            >
              -1
            </button>
            <button
              disabled={loading}
              onClick={() => onImageTransform({ x: 0, y: 0, s: 10 })}
            >
              +10
            </button>
            <button
              disabled={loading}
              onClick={() => onImageTransform({ x: 0, y: 0, s: -10 })}
            >
              -10
            </button>
            <button
              disabled={loading}
              onClick={() => onImageTransform({ x: 0, y: 0, s: 100 })}
            >
              +100
            </button>
            <button
              disabled={loading}
              onClick={() => onImageTransform({ x: 0, y: 0, s: -100 })}
            >
              -100
            </button>
          </div>
          <div>
            <button
              disabled={loading}
              onClick={() => onImageTransform({ x: -1, y: 0, s: 0 })}
            >
              LEFT
            </button>
            <button
              disabled={loading}
              onClick={() => onImageTransform({ x: +1, y: 0, s: 0 })}
            >
              RIGHT
            </button>
            <button
              disabled={loading}
              onClick={() => onImageTransform({ x: 0, y: -1, s: 0 })}
            >
              UP
            </button>
            <button
              disabled={loading}
              onMouseDown={() => onImageTransform({ x: 0, y: 1, s: 0 })}
            >
              DOWN
            </button>
            <div>
              <button disabled={!imageData} onClick={handleDecode}>
                DECODE
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Convertor;
