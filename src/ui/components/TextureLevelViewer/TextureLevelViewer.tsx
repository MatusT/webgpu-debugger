import React, { useState, useRef, useEffect, useContext, PointerEvent } from 'react';
import { ReplayTexture } from '../../../replay';
import { getUnwrappedGPUCanvasContext } from '../../../capture';
import { UIStateContext } from '../../contexts/UIStateContext';
import Checkbox from '../../components/Checkbox/Checkbox';
import SelectSimple from '../../components/SelectSimple/SelectSimple';
import Range from '../../components/Range/Range';
import { TextureRenderer, CubeTextureRenderer, TextureColorPicker } from './TextureRenderer';

import './TextureLevelViewer.css';

const s_displayTypes = ['2d', 'cube'];
const DEG_TO_RAD = Math.PI / 180;

interface Props {
    texture: ReplayTexture;
    baseMipLevel?: number;
    mipLevelCount?: number;
    baseArrayLayer?: number;
    arrayLayerCount?: number;
    displayType?: string;
}

const TextureLevelViewer: React.FC<Props> = ({
    texture,
    baseMipLevel = 0,
    mipLevelCount,
    baseArrayLayer = 0,
    arrayLayerCount,
    displayType = '2d',
}: Props) => {
    const [actualSize, setActualSize] = useState(false);
    const [pixelated, setPixelated] = useState(false);
    const [mipLevel, setMipLevel] = useState(baseMipLevel);
    const [arrayLayer, setArrayLayer] = useState(baseArrayLayer);
    const [display, setDisplay] = useState(displayType);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { helper } = useContext(UIStateContext);

    if (mipLevelCount === undefined) {
        mipLevelCount = texture.mipLevelCount - baseMipLevel;
    }
    if (arrayLayerCount === undefined) {
        arrayLayerCount = texture.size.depthOrArrayLayers - baseArrayLayer;
    }

    const maxMipLevel = baseMipLevel + mipLevelCount - 1;
    const maxArrayLayer = baseArrayLayer + arrayLayerCount - 1;

    let angleX = 0;
    let angleY = 0;
    let dragging = false;
    async function pointerDown(e: PointerEvent<HTMLCanvasElement>) {
        if (display === 'cube') {
            dragging = true;
        } else {
            const picker = TextureColorPicker.getColorPickerForDevice(texture.device.webgpuObject!);
            const x = Math.floor(e.nativeEvent.offsetX * (e.target.width / e.target.offsetWidth));
            const y = Math.floor(e.nativeEvent.offsetY * (e.target.height / e.target.offsetHeight));
            const result = await picker.getColor(texture.webgpuObject, x, y, mipLevel, arrayLayer);
            console.log(`Color picker result for (${x}, ${y}): [${result[0]}, ${result[1]}, ${result[2]}, ${result[3]}]`);
        }
    }

    function pointerUp() {
        dragging = false;
    }

    function pointerMove(e: PointerEvent<HTMLCanvasElement>) {
        if (dragging) {
            angleX += e.movementX * DEG_TO_RAD;
            angleY += e.movementY * DEG_TO_RAD;
        }
    }

    useEffect(() => {
        const device = texture.device.webgpuObject!;

        const canvas = canvasRef.current!;
        canvas.width = texture.size.width >> mipLevel;
        canvas.height = texture.size.height >> mipLevel;

        const context = getUnwrappedGPUCanvasContext(canvas);
        context.configure({
            device,
            format: navigator.gpu.getPreferredCanvasFormat(),
            alphaMode: 'premultiplied',
        });

        let rafId = -1;
        const draw = () => {
            switch (display) {
                case '2d':
                    {
                        const renderer = TextureRenderer.getRendererForDevice(device);
                        renderer.render(context, texture.webgpuObject, mipLevel, arrayLayer);
                    }
                    break;
                case 'cube':
                    {
                        rafId = requestAnimationFrame(draw);
                        const renderer = CubeTextureRenderer.getRendererForDevice(device);
                        renderer.render(context, texture.webgpuObject, mipLevel, 0, angleX, angleY);
                    }
                    break;
            }
        };
        draw();

        return () => {
            cancelAnimationFrame(rafId);
        };
    }, [texture, mipLevel, arrayLayer, display, helper.state.replayCount]);

    return (
        <div className="spector2-textureviewer" style={{ imageRendering: pixelated ? 'pixelated' : 'auto' }}>
            <div>
                <Checkbox label="Display actual size:" checked={actualSize} onChange={setActualSize} />
                <Checkbox label="Pixelated:" checked={pixelated} onChange={setPixelated} />
                {arrayLayerCount >= 6 && (
                    <SelectSimple label="Display as:" value={display} options={s_displayTypes} onChange={setDisplay} />
                )}
            </div>
            {arrayLayerCount > 1 && display === '2d' && (
                <div>
                    <Range
                        label="Layer:"
                        min={baseArrayLayer}
                        max={maxArrayLayer}
                        value={arrayLayer}
                        valueFormatFn={(v: number) => `${v} of [${baseArrayLayer}, ${maxArrayLayer}]`}
                        onChange={setArrayLayer}
                    />
                </div>
            )}
            {mipLevelCount > 1 && (
                <div>
                    <Range
                        label="Mip Level:"
                        min={baseMipLevel}
                        max={maxMipLevel}
                        value={mipLevel}
                        valueFormatFn={(v: number) => `${v} of [${baseMipLevel}, ${maxMipLevel}]`}
                        onChange={setMipLevel}
                    />
                </div>
            )}
            <div className="spector2-textureviewer-canvascontainer">
                <canvas
                    ref={canvasRef}
                    className={actualSize ? display : `fill ${display}`}
                    onPointerDown={pointerDown}
                    onPointerUp={pointerUp}
                    onPointerMove={pointerMove}
                />
            </div>
        </div>
    );
};

export default TextureLevelViewer;
