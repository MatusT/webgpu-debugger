// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { GPUExtent3DDictFull } from '../lib/utils';
import {
    kTextureFormatInfo,
    Trace,
    TraceAdapter,
    TraceBindGroup,
    TraceBindGroupLayout,
    TraceBuffer,
    TraceBufferUpdate,
    TraceCommandBuffer,
    TraceData,
    TraceDevice,
    TraceExplicitBindGroupLayout,
    TracePipelineLayout,
    TraceQuerySet,
    TraceQueue,
    TraceQueueCommandBufferUnmap,
    TraceQueueCommandBufferUpdateData,
    TraceQueueCommandPresent,
    TraceQueueCommandSubmit,
    TraceQueueCommandTextureDestroy,
    TraceQueueCommandWriteBuffer,
    TraceQueueCommandWriteTexture,
    TraceRenderPipeline,
    TraceSampler,
    TraceShaderModule,
    TraceTexture,
    TraceTextureInitialData,
    TraceTextureView,
} from '../capture';

type RequestAdapterFn = (options: GPURequestAdapterOptions) => Promise<GPUAdapter>;

let requestUnwrappedAdapter: RequestAdapterFn;

export async function loadReplay(trace: Trace, requestUnwrappedAdapterFn: RequestAdapterFn) {
    requestUnwrappedAdapter = requestUnwrappedAdapterFn;
    const replay = new Replay();
    await replay.load(trace);
    return replay;
}

export interface ReplayImageCopyTexture {
    texture: ReplayTexture;
    mipLevel: number;
    origin: GPUOrigin3D;
    aspect: GPUTextureAspect;
}

export interface ReplayImageCopyBuffer {
    buffer: ReplayBuffer;
    offset: number;
    bytesPerRow?: number;
    rowsPerImage?: number;
}

export interface ReplayCommandBufferCommandCopyTextureToTexture {
    name: 'copyTextureToTexture';
    args: {
        source: ReplayImageCopyTexture;
        destination: ReplayImageCopyTexture;
        copySize: GPUExtent3D;
    };
}

export interface ReplayCommandBufferCommandCopyBufferToTexture {
    name: 'copyBufferToTexture';
    args: {
        source: ReplayImageCopyBuffer;
        destination: ReplayImageCopyTexture;
        copySize: GPUExtent3D;
    };
}

export interface ReplayRenderPassColorAttachment {
    view: GPUTextureView;
    viewState: ReplayTexture;
    resolveTarget?: GPUTextureView;
    resolveTargetState?: ReplayTextureView;
    clearValue: GPUColorDict;
    loadOp: GPULoadOp;
    storeOp: GPUStoreOp;
}

export interface ReplayRenderPassTimestampWrite {
    querySet: GPUQuerySet;
    querySetState: ReplayQuerySet;
    queryIndex: number;
    location: GPURenderPassTimestampLocation;
}

export interface ReplayRenderPassDepthStencilAttachment {
    view: GPUTextureView;
    viewState: ReplayTextureView;
    depthClearValue: number;
    depthLoadOp?: GPULoadOp;
    depthStoreOp?: GPUStoreOp;
    depthReadOnly: boolean;
    stencilClearValue: number;
    stencilLoadOp?: GPULoadOp;
    stencilStoreOp?: GPUStoreOp;
    stencilReadOnly: boolean;
}

export interface ReplayCommandBeginRenderPassArgs {
    colorAttachments: ReplayRenderPassColorAttachment[];
    timestampWrites: ReplayRenderPassTimestampWrite[];
    occlusionQuerySet?: GPUQuerySet;
    occlusionQuerySetState?: ReplayQuerySet;
    maxDrawCount: number;
    depthStencilAttachment?: ReplayRenderPassDepthStencilAttachment;
}

// Pseudo command. This command exists in the command buffer
// where as the beingRenderPass exists in the renderPass
export interface ReplayCommandBufferCommandRenderPass {
    name: 'renderPass';
    renderPass: ReplayRenderPass;
}

export interface ReplayCommandBufferCommandBeginRenderPass {
    name: 'beginRenderPass';
    args: ReplayCommandBeginRenderPassArgs;
}

export interface ReplayCommandBufferCommandEndPass {
    name: 'endPass';
}

export interface ReplayCommandBufferCommandDraw {
    name: 'draw';
    args: {
        vertexCount: number;
        instanceCount: number;
        firstVertex: number;
        firstInstance: number;
    };
}

export interface ReplayCommandBufferCommandDrawIndexed {
    name: 'drawIndexed';
    args: {
        indexCount: number;
        instanceCount: number;
        firstIndex: number;
        baseVertex: number;
        firstInstance: number;
    };
}

export interface ReplayCommandBufferCommandPopDebugGroup {
    name: 'popDebugGroup';
}

export interface ReplayCommandBufferCommandPushDebugGroup {
    name: 'pushDebugGroup';
    args: {
        groupLabel: string;
    };
}

export interface ReplayCommandBufferCommandSetBindGroup {
    name: 'setBindGroup';
    args: {
        index: number;
        bindGroup: ReplayBindGroup;
    };
}

export interface ReplayCommandBufferCommandSetIndexBuffer {
    name: 'setIndexBuffer';
    args: {
        buffer: ReplayBuffer;
        indexFormat: GPUIndexFormat;
        offset: number;
        size: number;
    };
}

export interface ReplayCommandBufferCommandSetPipeline {
    name: 'setPipeline';
    args: {
        pipeline: ReplayRenderPipeline;
    };
}

export interface ReplayCommandBufferCommandSetVertexBuffer {
    name: 'setVertexBuffer';
    args: {
        slot: number;
        buffer: ReplayBuffer;
        offset: number;
        size: number;
    };
}

export interface ReplayCommandBufferCommandSetScissorRect {
    name: 'setScissorRect';
    args: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

export interface ReplayCommandBufferCommandSetViewport {
    name: 'setViewport';
    args: {
        x: number;
        y: number;
        width: number;
        height: number;
        minDepth: number;
        maxDepth: number;
    };
}

export type ReplayCommandBufferCommand =
    | ReplayCommandBufferCommandCopyTextureToTexture
    | ReplayCommandBufferCommandCopyBufferToTexture
    | ReplayCommandBufferCommandPopDebugGroup
    | ReplayCommandBufferCommandPushDebugGroup
    | ReplayCommandBufferCommandBeginRenderPass
    | ReplayCommandBufferCommandDraw
    | ReplayCommandBufferCommandDrawIndexed
    | ReplayCommandBufferCommandRenderPass
    | ReplayCommandBufferCommandSetBindGroup
    | ReplayCommandBufferCommandSetIndexBuffer
    | ReplayCommandBufferCommandSetPipeline
    | ReplayCommandBufferCommandSetVertexBuffer
    | ReplayCommandBufferCommandSetScissorRect
    | ReplayCommandBufferCommandSetViewport
    | ReplayCommandBufferCommandEndPass;

export interface ReplayCommandSubmit {
    name: 'queueSubmit';
    queue: ReplayQueue;
    args: {
        commandBuffers: ReplayCommandBuffer[];
    };
}

export interface ReplayCommandWriteBuffer {
    name: 'queueWriteBuffer';
    queue: ReplayQueue;
    args: {
        buffer: ReplayBuffer;
        bufferOffset: number;
        data: TraceData;
    };
}

export interface ReplayCommandWriteTexture {
    name: 'queueWriteTexture';
    queue: ReplayQueue;
    args: {
        destination: {
            textureState: ReplayTexture;
            texture: GPUTexture;
            mipLevel: number;
            origin: any;
            aspect: GPUTextureAspect;
        };
        data: TraceData;
        dataLayout: GPUImageDataLayout;
        size: GPUExtent3D;
    };
}

export interface ReplayCommandBad {
    name: 'bad-command';
}

export interface ReplayCommandPresent {
    name: 'present';
    args: {
        texture: ReplayTexture;
        canvasContextSerial: number;
    };
}

export interface ReplayCommandTextureDestroy {
    name: 'textureDestroy';
    texture: ReplayTexture;
}

export interface ReplayCommandBufferUpdateData {
    name: 'bufferUpdateData';
    buffer: ReplayBuffer;
    updates: TraceBufferUpdate[];
}

export interface ReplayCommandBufferUnmap {
    name: 'bufferUnmap';
    buffer: ReplayBuffer;
}

export type ReplayQueueCommand =
    | ReplayCommandSubmit
    | ReplayCommandWriteBuffer
    | ReplayCommandWriteTexture
    | ReplayCommandPresent
    | ReplayCommandTextureDestroy
    | ReplayCommandBufferUpdateData
    | ReplayCommandBufferUnmap
    | ReplayCommandBad;

export class Replay {
    commands: ReplayQueueCommand[] = [];
    state: any;

    adapters: Record<string, ReplayAdapter> = {};
    devices: Record<string, ReplayDevice> = {};
    queues: Record<string, ReplayQueue> = {};
    bindGroupLayouts: Record<string, ReplayBindGroupLayout> = {};
    pipelineLayouts: Record<string, ReplayPipelineLayout> = {};
    shaderModules: Record<string, ReplayShaderModule> = {};
    renderPipelines: Record<string, ReplayRenderPipeline> = {};
    buffers: Record<string, ReplayBuffer> = {};
    samplers: Record<string, ReplaySampler> = {};
    textures: Record<string, ReplayTexture> = {};
    textureViews: Record<string, ReplayTextureView> = {};
    querySets: Record<string, ReplayQuerySet> = {};
    bindGroups: Record<string, ReplayBindGroup> = {};
    commandBuffers: Record<string, ReplayCommandBuffer> = {};

    adaptersToReplayMap = new Map<GPUAdapter, ReplayAdapter>();
    devicesToReplayMap = new Map<GPUDevice, ReplayDevice>();
    queuesToReplayMap = new Map<GPUQueue, ReplayQueue>();
    bindGroupLayoutsToReplayMap = new Map<GPUBindGroupLayout, ReplayBindGroupLayout>();
    pipelineLayoutsToReplayMap = new Map<GPUPipelineLayout, ReplayPipelineLayout>();
    shaderModulesToReplayMap = new Map<GPUShaderModule, ReplayShaderModule>();
    renderPipelinesToReplayMap = new Map<GPURenderPipeline, ReplayRenderPipeline>();
    buffersToReplayMap = new Map<GPUBuffer, ReplayBuffer>();
    samplersToReplayMap = new Map<GPUSampler, ReplaySampler>();
    texturesToReplayMap = new Map<GPUTexture, ReplayTexture>();
    textureViewsToReplayMap = new Map<GPUTextureView, ReplayTextureView>();
    querySetsToReplayMap = new Map<GPUQuerySet, ReplayQuerySet>();
    bindGroupsToReplayMap = new Map<GPUBindGroup, ReplayBindGroup>();
    commandBuffersToReplayMap = new Map<GPUCommandBuffer, ReplayCommandBuffer>();

    constructor() {}

    async load(trace: Trace) {
        async function recreateObjectsAsync<T, T2>(
            replay: Replay,
            Class: new (replay: Replay, desc: any) => T,
            descMap: Record<string, T>
        ) {
            if (descMap === undefined) {
                return {};
            }

            const recreatePromises = [];
            const recreatedObjects: Record<string, T> = {};
            const mapToReplayObjects = new Map<T2, T>();
            for (const traceSerial in descMap) {
                const desc = descMap[traceSerial];
                const obj = new Class(replay, desc);

                recreatePromises.push(obj.recreate(desc));
                recreatedObjects[traceSerial] = obj;
                mapToReplayObjects.set(obj.webgpuObject, obj);
            }

            await Promise.all(recreatePromises);
            return [recreatedObjects, mapToReplayObjects];
        }

        function recreateObjects<T, T2>(
            replay: Replay,
            Class: new (replay: Replay, desc: any) => T,
            descMap: Record<string, T>
        ) {
            if (descMap === undefined) {
                return {};
            }

            const recreatedObjects: Record<string, T> = {};
            const mapToReplayObjects = new Map<T2, T>();
            for (const traceSerial in descMap) {
                const desc = descMap[traceSerial];
                const obj = new Class(replay, desc);
                recreatedObjects[traceSerial] = obj;
                mapToReplayObjects.set(obj.webgpuObject, obj);
            }
            return [recreatedObjects, mapToReplayObjects];
        }

        this.data = {};
        for (const dataSerial in trace.data) {
            const badArray = trace.data[dataSerial];
            const dataBuf = new Uint8Array(badArray.length);
            for (let i = 0; i < badArray.length; i++) {
                dataBuf[i] = badArray[i];
            }
            this.data[dataSerial] = dataBuf;
        }

        [this.adapters, this.adaptersToReplayMap] = await recreateObjectsAsync(
            this,
            ReplayAdapter,
            trace.objects.adapters
        );
        [this.devices, this.devicesToReplayMap] = await recreateObjectsAsync(this, ReplayDevice, trace.objects.devices);
        [this.queues, this.queuesToReplayMap] = recreateObjects(this, ReplayQueue, trace.objects.queues);

        [this.bindGroupLayouts, this.bindGroupLayoutsReplyMap] = recreateObjects(
            this,
            ReplayBindGroupLayout,
            trace.objects.bindGroupLayouts
        );
        [this.pipelineLayouts, this.pipelineLayoutsReplyMap] = recreateObjects(
            this,
            ReplayPipelineLayout,
            trace.objects.pipelineLayouts
        );
        [this.shaderModules, this.shaderModulesReplyMap] = recreateObjects(
            this,
            ReplayShaderModule,
            trace.objects.shaderModules
        );
        [this.renderPipelines, this.renderPipelinesReplyMap] = await recreateObjectsAsync(
            this,
            ReplayRenderPipeline,
            trace.objects.renderPipelines
        );
        // Initialive the implicit bind group layouts now that all pipelines are created.
        // Luckily implicit layouts can't be used to create pipeline layouts so we don't have circular dependencies.
        for (const i in this.bindGroupLayouts) {
            if (this.bindGroupLayouts[i].implicit) {
                this.bindGroupLayouts[i].initializeFromImplicitDesc();
            }
        }

        [this.buffers, this.buffersReplyMap] = recreateObjects(this, ReplayBuffer, trace.objects.buffers);
        [this.samplers, this.samplersReplyMap] = recreateObjects(this, ReplaySampler, trace.objects.samplers);
        [this.textures, this.texturesReplyMap] = recreateObjects(this, ReplayTexture, trace.objects.textures);
        [this.textureViews, this.textureViewsReplyMap] = recreateObjects(
            this,
            ReplayTextureView,
            trace.objects.textureViews
        );
        [this.querySets, this.querySetsReplyMap] = recreateObjects(this, ReplayQuerySet, trace.objects.querySets);
        [this.bindGroups, this.bindGroupsReplyMap] = recreateObjects(this, ReplayBindGroup, trace.objects.bindGroups);

        [this.commandBuffers, this.commandBuffersReplyMap] = recreateObjects(
            this,
            ReplayCommandBuffer,
            trace.objects.commandBuffers
        );
        // GPUCommandEncoder, GPURenderPassEncoder, GPUCanvasContext not needed for replay?

        this.commands = trace.commands.map(command => {
            const c = window.structuredClone(command); // Do we need this?
            switch (c.name) {
                case 'queueSubmit': {
                    const cmd = c as TraceQueueCommandSubmit;
                    return {
                        name: 'queueSubmit',
                        queue: this.queues[cmd.queueSerial],
                        args: {
                            commandBuffers: cmd.args.commandBufferSerials.map(serial => this.commandBuffers[serial]),
                        },
                    };
                }
                case 'queueWriteBuffer': {
                    const cmd = c as TraceQueueCommandWriteBuffer;
                    return {
                        name: 'queueWriteBuffer',
                        queue: this.queues[cmd.queueSerial],
                        args: {
                            buffer: this.buffers[cmd.args.bufferSerial],
                            bufferOffset: cmd.args.bufferOffset,
                            data: cmd.args.data,
                        },
                    };
                }
                case 'queueWriteTexture': {
                    const cmd = c as TraceQueueCommandWriteTexture;
                    const args = cmd.args;
                    const destination = args.destination;
                    const textureState = this.textures[destination.textureSerial];
                    const texture = textureState.webgpuObject;
                    return {
                        name: 'queueWriteTexture',
                        queue: this.queues[cmd.queueSerial],
                        args: {
                            destination: {
                                textureState,
                                texture,
                                mipLevel: destination.mipLevel,
                                origin: destination.origin,
                                aspect: destination.aspect,
                            },
                            data: args.data,
                            dataLayout: args.dataLayout,
                            size: args.size,
                        },
                    };
                }
                case 'present': {
                    const cmd = c as TraceQueueCommandPresent;
                    const args = cmd.args;
                    return {
                        name: 'present',
                        args: {
                            texture: this.textures[args.textureSerial],
                            canvasContextSerial: args.canvasContextSerial,
                        },
                    };
                }
                case 'textureDestroy': {
                    const cmd = c as TraceQueueCommandTextureDestroy;
                    return {
                        name: 'textureDestroy',
                        texture: this.textures[cmd.textureSerial],
                    };
                }
                case 'bufferUpdateData': {
                    const cmd = c as TraceQueueCommandBufferUpdateData;
                    return {
                        name: 'bufferUpdateData',
                        buffer: this.buffers[cmd.bufferSerial],
                        updates: cmd.updates,
                    };
                }
                case 'bufferUnmap': {
                    const cmd = c as TraceQueueCommandBufferUnmap;
                    return {
                        name: 'bufferUnmap',
                        buffer: this.buffers[cmd.bufferSerial],
                    };
                }
                default:
                    console.assert(false, `Unhandled command type '${c.name}'`);
                    return { name: 'bad-command' };
            }
        });
    }

    getData(serializedData) {
        const dataBuf = this.data[serializedData.serial];
        console.assert(dataBuf.byteLength === serializedData.size);
        return dataBuf;
    }

    // Note sure what the correct abstraction is for partial replays etc.
    execute(command: ReplayQueueCommand) {
        switch (command.name) {
            case 'queueSubmit':
                command.queue.executeSubmit(command.args.commandBuffers);
                break;

            case 'queueWriteBuffer': {
                const dataBuf = this.getData(command.args.data);
                command.queue.webgpuObject.writeBuffer(
                    command.args.buffer.webgpuObject,
                    command.args.bufferOffset,
                    dataBuf
                );
                break;
            }

            case 'queueWriteTexture': {
                const dataBuf = this.getData(command.args.data);
                command.queue.webgpuObject.writeTexture(
                    command.args.destination,
                    dataBuf,
                    { ...command.args.dataLayout, offset: 0 },
                    command.args.size
                );
                break;
            }

            case 'present':
                // Nothing to do?
                this.state = { currentTexture: command.args.texture }; // TODO: hack-remove
                break;

            case 'textureDestroy':
                // Do nothing so as to not invalidate replay state.
                break;

            default:
                console.assert(false, `Unhandled command type '${command.name}'`);
        }
    }

    *iterateCommands() {
        // Return index, command
        for (let i = 0; i < this.commands.length; i++) {
            const c = this.commands[i];
            switch (c.name) {
                case 'queueWriteBuffer':
                case 'queueWriteTexture':
                case 'present':
                case 'textureDestroy':
                case 'bufferUpdateData':
                case 'bufferUnmap':
                    yield { path: [i], command: c };
                    break;

                case 'queueSubmit':
                    for (let j = 0; j < c.args.commandBuffers.length; j++) {
                        yield* c.args.commandBuffers[j].iterateCommands([i, j]);
                    }
                    break;

                default:
                    console.assert(false, `Unhandled command type '${c.name}'`);
            }
        }
    }

    endPath() {
        return [this.commands.length];
    }

    async replayTo(path: number[]) {
        this.state = {}; // TODO: hack, remove
        // TODO resetState
        path = path.slice();
        const replayLevel = path.shift()!;
        for (let i = 0; i <= replayLevel; i++) {
            const c = this.commands[i];
            if (c.name === 'queueSubmit') {
                if (i === replayLevel) {
                    c.queue.replaySubmitTo(path, c.args.commandBuffers);
                } else {
                    c.queue.executeSubmit(c.args.commandBuffers);
                }
            } else {
                // TODO fold executeCommand here.
                this.execute(c);
            }
        }
        return this.state; // TODO: hack, remove
    }

    getState() {
        return this.state;
    }
}

let lastReplayObjectKey = 0;
const replayObjectKeys = new Map<ReplayObject, number>();

class ReplayObject {
    replay: Replay;
    label: string;

    constructor(replay, desc) {
        this.replay = replay;
        this.label = desc.label ?? '';
        replayObjectKeys.set(this, lastReplayObjectKey++);
    }

    get replayObjectKey() {
        return replayObjectKeys.get(this);
    }
}

class ReplayResourceObject<T> extends ReplayObject {
    webgpuObject?: T;
}

export class ReplayAdapter extends ReplayResourceObject<GPUAdapter> {
    adapterInfo?: GPUAdapterInfo;

    constructor(replay: Replay, desc: TraceAdapter) {
        super(replay, desc);

        if (this.webgpuObject) {
            this.webgpuObject.requestAdapterInfo().then(adapterInfo => {
                this.adapterInfo = adapterInfo;
            });
        }
    }

    async recreate(desc: TraceAdapter) {
        this.webgpuObject = await requestUnwrappedAdapter(desc);
        this.adapterInfo = await this.webgpuObject.requestAdapterInfo();
    }
}

export class ReplayRenderPass extends ReplayObject {
    commands: ReplayCommandBufferCommand[];

    constructor(replay: Replay, desc) {
        super(replay, desc);
        this.commands = [];
    }

    consumeCommands(beginRenderPassCommand, commandIterator) {
        console.assert(this.commands.length === 0);
        this.commands.push(beginRenderPassCommand);

        for (const command of commandIterator) {
            const c = window.structuredClone(command);
            switch (c.name) {
                case 'endPass':
                    this.commands.push(c);
                    return;

                case 'setBindGroup':
                    c.args.bindGroup = this.replay.bindGroups[c.args.bindGroupSerial];
                    delete c.args.bindGroupSerial;
                    break;
                case 'setIndexBuffer':
                    c.args.buffer = this.replay.buffers[c.args.bufferSerial];
                    delete c.args.bufferSerial;
                    break;
                case 'setPipeline':
                    c.args.pipeline = this.replay.renderPipelines[c.args.pipelineSerial];
                    delete c.args.pipelineSerial;
                    break;
                case 'setVertexBuffer':
                    c.args.buffer = this.replay.buffers[c.args.bufferSerial];
                    delete c.args.bufferSerial;
                    break;
                case 'draw':
                case 'drawIndexed':
                    break;
                case 'setViewport':
                case 'pushDebugGroup':
                case 'popDebugGroup':
                    break;
                default:
                    console.assert(false, `Unhandled render pass command type '${c.name}'`);
            }
            this.commands.push(c);
        }

        console.assert(false, `BeginRenderPass command doesn't have an associated EndPass.`);
    }

    encodeIn(encoder) {
        this.encodeUpTo([this.commands.length - 1], encoder);
    }

    encodeUpTo(path, encoder) {
        const commandIndex = path.shift();

        console.assert(this.commands.length > 0);
        console.assert(this.commands[0].name === 'beginRenderPass');
        console.assert(this.commands[this.commands.length - 1].name === 'endPass');

        const renderPassDesc = (this.commands[0] as ReplayCommandBufferCommandBeginRenderPass).args;

        if (commandIndex !== this.commands.length) {
            for (const a of renderPassDesc.colorAttachments ?? []) {
                if (a.storeOp === 'discard') {
                    console.warn("Don't know how to turn discard into stores yet");
                }
            }
            const ds = renderPassDesc.depthStencilAttachment;
            if (ds) {
                if (ds.stencilStoreOp === 'discard' || ds.depthStoreOp === 'discard') {
                    console.warn("Don't know how to turn discard into stores yet");
                }
            }
        }

        console.assert(
            renderPassDesc.colorAttachments[0]?.viewState,
            'Computing render pass size currently requires the first color attachment to always be set.'
        );
        const firstAttachment = renderPassDesc.colorAttachments[0].viewState;
        console.assert(firstAttachment.baseMipLevel === 0);

        if (commandIndex === 0) {
            this.replay.state = this.commands[0].args;
            return;
        }

        const state = {
            viewport: {
                x: 0,
                y: 0,
                width: firstAttachment.texture.size.width,
                height: firstAttachment.texture.size.height,
                minDepth: 0.0,
                maxDepth: 1.0,
            },
            colorAttachments: renderPassDesc.colorAttachments.map(a => {
                return { view: a.viewState, resolveTarget: a.resolveTargetState };
            }),
            depthStencilAttachment: { view: renderPassDesc.depthStencilAttachment?.viewState },
            pipeline: null,
            bindGroups: [],
            vertexBuffers: [],
            indexBuffer: { buffer: null, offset: 0, size: 0 },
        };

        const renderPass = encoder.beginRenderPass(renderPassDesc);
        let renderPassEnded = false;

        // HAAAAACK
        const a = renderPassDesc.colorAttachments[0];
        if (a.resolveTarget) {
            this.replay.textureStateToShow = a.resolveTargetState.texture;
        } else {
            this.replay.textureStateToShow = a.viewState.texture;
        }

        for (let i = 1; i <= commandIndex; i++) {
            const c = this.commands[i];
            switch (c.name) {
                case 'draw':
                    renderPass.draw(c.args.vertexCount, c.args.instanceCount, c.args.firstVertex, c.args.firstInstance);
                    break;
                case 'drawIndexed':
                    renderPass.drawIndexed(
                        c.args.indexCount,
                        c.args.instanceCount,
                        c.args.firstIndex,
                        c.args.baseVertex,
                        c.args.firstInstance
                    );
                    break;
                case 'endPass':
                    renderPass.end();
                    renderPassEnded = true;
                    break;
                case 'popDebugGroup':
                    renderPass.popDebugGroup();
                    break;
                case 'pushDebugGroup':
                    renderPass.pushDebugGroup(c.args.groupLabel);
                    break;
                case 'setBindGroup':
                    renderPass.setBindGroup(c.args.index, c.args.bindGroup.webgpuObject, c.dynamicOffsets);
                    state.bindGroups[c.args.index] = { group: c.args.bindGroup, dynamicOffsets: c.dynamicOffsets };
                    break;
                case 'setIndexBuffer':
                    renderPass.setIndexBuffer(
                        c.args.buffer.webgpuObject,
                        c.args.indexFormat,
                        c.args.offset,
                        c.args.size
                    );
                    state.indexBuffer = { buffer: c.args.buffer, offset: c.args.offset, size: c.args.size };
                    break;
                case 'setPipeline':
                    renderPass.setPipeline(c.args.pipeline.webgpuObject);
                    state.pipeline = c.args.pipeline;
                    break;
                case 'setVertexBuffer':
                    renderPass.setVertexBuffer(c.args.slot, c.args.buffer.webgpuObject, c.args.offset, c.args.size);
                    state.vertexBuffers[c.args.slot] = {
                        buffer: c.args.buffer,
                        offset: c.args.offset,
                        size: c.args.size,
                    };
                    break;
                case 'setViewport':
                    renderPass.setViewport(
                        c.args.x,
                        c.args.y,
                        c.args.width,
                        c.args.height,
                        c.args.minDepth,
                        c.args.maxDepth
                    );
                    state.viewport = { ...c.args };
                    break;
                default:
                    console.assert(false, `Unhandled render pass command type '${c.name}'`);
            }
        }

        if (!renderPassEnded) {
            this.replay.state = state;
            renderPass.end();
        }
    }

    *iterateCommands([i, j, k]) {
        for (let l = 0; l < this.commands.length; l++) {
            const c = this.commands[l];
            switch (c.name) {
                case 'beginRenderPass':
                case 'copyBufferToTexture':
                case 'copyTextureToTexture':
                case 'draw':
                case 'drawIndexed':
                case 'endPass':
                case 'popDebugGroup':
                case 'pushDebugGroup':
                case 'setBindGroup':
                case 'setIndexBuffer':
                case 'setPipeline':
                case 'setVertexBuffer':
                case 'setViewport':
                    yield { path: [i, j, k, l], command: c };
                    break;
                default:
                    console.assert(false, `Unhandled render pass command type '${c.name}'`);
            }
        }
    }
}

export class ReplayCommandBuffer extends ReplayObject {
    commands: ReplayCommandBufferCommand[];

    constructor(replay: Replay, desc: TraceCommandBuffer) {
        super(replay, desc);
        this.commands = [];

        const commandIterator = desc.commands.values();
        this.consumeCommands(commandIterator);
        console.assert(commandIterator.next().done);
    }

    consumeCommands(commandIterator) {
        console.assert(this.commands.length === 0);

        for (const command of commandIterator) {
            const c = window.structuredClone(command);
            switch (c.name) {
                case 'beginRenderPass': {
                    for (const a of c.args.colorAttachments) {
                        a.viewState = this.replay.textureViews[a.viewSerial];
                        a.view = a.viewState.webgpuObject;
                        delete a.viewSerial;

                        if (a.resolveTargetSerial) {
                            a.resolveTargetState = this.replay.textureViews[a.resolveTargetSerial];
                            a.resolveTarget = a.resolveTargetState.webgpuObject;
                            delete a.resolveTargetSerial;
                        }
                    }

                    const ds = c.args.depthStencilAttachment;
                    if (ds !== undefined) {
                        ds.viewState = this.replay.textureViews[ds.viewSerial];
                        ds.view = ds.viewState.webgpuObject;
                        delete ds.viewSerial;
                    }

                    for (const w of c.args.timestampWrites) {
                        w.querySetState = this.replay.querySets[w.querySetSerial];
                        w.querySet = w.querySet.webgpuObject;
                        delete w.querySetSerial;
                    }

                    if (c.args.occlusionQuerySetSerial !== undefined) {
                        c.args.occlusionQuerySetState = this.replay.querySets[c.args.occlusionQuerySetSerial];
                        c.args.occlusionQuerySet = c.args.occlusionQuerySetState;
                        delete c.args.occlusionQuerySetSerial;
                    }

                    // Special case, add a pseudo-command that's a whole render pass command.
                    const rp = new ReplayRenderPass(this.replay, c.args);
                    rp.consumeCommands(c, commandIterator);
                    this.commands.push({ name: 'renderPass', renderPass: rp });
                    continue;
                }
                case 'copyBufferToTexture':
                    c.args.source.bufferState = this.replay.buffers[c.args.source.bufferSerial];
                    c.args.source.buffer = c.args.source.bufferState.webgpuObject;
                    delete c.args.source.buffer;
                    c.args.destination.textureState = this.replay.textures[c.args.destination.textureSerial];
                    c.args.destination.texture = c.args.destination.textureState.webgpuObject;
                    delete c.args.destination.texture;
                    break;
                case 'copyTextureToTexture':
                    c.args.source.textureState = this.replay.textures[c.args.source.textureSerial];
                    c.args.source.texture = c.args.source.textureState.webgpuObject;
                    delete c.args.source.texture;
                    c.args.destination.textureState = this.replay.textures[c.args.destination.textureSerial];
                    c.args.destination.texture = c.args.destination.textureState.webgpuObject;
                    delete c.args.destination.texture;
                    break;
                case 'pushDebugGroup':
                case 'popDebugGroup':
                    break;
                default:
                    console.assert(false, `Unhandled command encoder command '${c.name}'`);
            }
            this.commands.push(c);
        }
    }

    encodeIn(encoder) {
        this.encodeUpTo([this.commands.length - 1], encoder, true);
    }

    encodeUpTo(path, encoder, full = false) {
        const commandIndex = path.shift();
        for (let i = 0; i <= commandIndex; i++) {
            const c = this.commands[i];
            switch (c.name) {
                case 'renderPass':
                    if (i === commandIndex && !full) {
                        c.renderPass.encodeUpTo(path, encoder);
                    } else {
                        c.renderPass.encodeIn(encoder);
                    }
                    break;
                case 'copyBufferToTexture':
                    encoder.copyBufferToTexture(c.args.source, c.args.destination, c.args.copySize);
                    break;
                case 'copyTextureToTexture':
                    encoder.copyTextureToTexture(c.args.source, c.args.destination, c.args.copySize);
                    break;
                case 'popDebugGroup':
                    encoder.popDebugGroup();
                    break;
                case 'pushDebugGroup':
                    encoder.pushDebugGroup(c.args.groupLabel);
                    break;
                default:
                    console.assert(false, `Unhandled command encoder command type '${c.name}'`);
            }
        }
    }

    *iterateCommands([i, j]) {
        for (let k = 0; k < this.commands.length; k++) {
            const c = this.commands[k];
            switch (c.name) {
                case 'renderPass':
                    yield* c.renderPass.iterateCommands([i, j, k]);
                    break;

                case 'copyBufferToTexture':
                case 'copyTextureToTexture':
                case 'popDebugGroup':
                case 'pushDebugGroup':
                    yield { path: [i, j, k], command: c };
                    break;
                default:
                    console.assert(false, `Unhandled command encoder command type '${c.name}'`);
            }
        }
    }
}

export class ReplayBuffer extends ReplayObject {
    device: ReplayDevice;
    usage: GPUBufferUsageFlags;
    size: number;
    webgpuObject: GPUBuffer;

    constructor(replay: Replay, desc: TraceBuffer) {
        super(replay, desc);
        this.device = this.replay.devices[desc.deviceSerial];
        this.usage = desc.usage;
        this.size = desc.size;
        console.assert(desc.state === 'unmapped' || desc.state === 'mapped-at-creation');

        this.webgpuObject = this.device.webgpuObject.createBuffer({
            usage: desc.usage | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
            size: desc.size,
            mappedAtCreation: desc.state === 'mapped-at-creation',
        });
        if (desc.initialData !== undefined) {
            const data = this.replay.getData(desc.initialData);
            this.device.webgpuObject.queue.writeBuffer(this.webgpuObject, 0, data);
        }
    }
}

export class ReplayBindGroup extends ReplayObject {
    device: ReplayDevice;
    //desc: GPUBindGroupDescriptor;
    webgpuObject: GPUBindGroup;
    bindings = [];

    constructor(replay: Replay, desc: TraceBindGroup) {
        super(replay, desc);
        //this.desc = desc;
        this.device = this.replay.devices[desc.deviceSerial];

        for (const e of desc.entries) {
            if (e.textureViewSerial !== undefined) {
                this.bindings[e.binding] = this.replay.textureViews[e.textureViewSerial];
            } else if (e.samplerSerial !== undefined) {
                this.bindings[e.binding] = this.replay.samplers[e.samplerSerial];
            } else if (e.bufferSerial !== undefined) {
                this.bindings[e.binding] = {
                    buffer: this.replay.buffers[e.bufferSerial],
                    offset: e.offset,
                    size: e.size,
                };
            }
        }

        this.webgpuObject = this.device.webgpuObject.createBindGroup({
            layout: this.replay.bindGroupLayouts[desc.layoutSerial].webgpuObject,
            entries: desc.entries.map(e => {
                const entry = { binding: e.binding };
                if (e.textureViewSerial !== undefined) {
                    entry.resource = this.replay.textureViews[e.textureViewSerial].webgpuObject;
                } else if (e.samplerSerial !== undefined) {
                    entry.resource = this.replay.samplers[e.samplerSerial].webgpuObject;
                } else if (e.bufferSerial !== undefined) {
                    entry.resource = {
                        buffer: this.replay.buffers[e.bufferSerial].webgpuObject,
                        offset: e.offset,
                        size: e.size,
                    };
                }
                return entry;
            }),
        });
    }
}

export class ReplayBindGroupLayout extends ReplayObject {
    device: ReplayDevice;
    desc: GPUBindGroupLayoutDescriptor;
    webgpuObject?: GPUBindGroupLayout;
    implicit: boolean;

    constructor(replay: Replay, desc: TraceBindGroupLayout) {
        super(replay, desc);
        this.device = this.replay.devices[desc.deviceSerial];
        this.desc = window.structuredClone(desc);

        this.implicit = (desc as TraceExplicitBindGroupLayout).entries === undefined;
        if (this.implicit) {
            return;
        }

        this.webgpuObject = this.device.webgpuObject.createBindGroupLayout(desc);
    }

    initializeFromImplicitDesc() {
        const pipeline = this.replay.renderPipelines[this.desc.renderPipelineSerial];
        this.webgpuObject = pipeline.webgpuObject.getBindGroupLayout(this.desc.groupIndex);
    }
}

export class ReplayDevice extends ReplayObject {
    webgpuObject!: GPUDevice;

    constructor(replay: Replay, desc: TraceDevice) {
        super(replay, desc);
    }

    async recreate(desc: TraceDevice) {
        const adapter = this.replay.adapters[desc.adapterSerial].webgpuObject;
        this.webgpuObject = await adapter.requestDevice();
    }
}

export class ReplayPipelineLayout extends ReplayObject {
    device: ReplayDevice;
    webgpuObject!: GPUPipelineLayout;

    constructor(replay: Replay, desc: TracePipelineLayout) {
        super(replay, desc);
        this.device = this.replay.devices[desc.deviceSerial];
        this.webgpuObject = this.device.webgpuObject.createPipelineLayout({
            bindGroupLayouts: desc.bindGroupLayoutsSerial.map(s => this.replay.bindGroupLayouts[s].webgpuObject),
        });
    }
}

export class ReplayQuerySet extends ReplayObject {
    device: ReplayDevice;
    webgpuObject!: GPUQuerySet;

    constructor(replay: Replay, desc: TraceQuerySet) {
        super(replay, desc);
        this.device = this.replay.devices[desc.deviceSerial];
        this.webgpuObject = this.device.webgpuObject.createQuerySet(desc);
        // TODO how to put the initial data ???
    }
}

export class ReplayQueue extends ReplayObject {
    device: ReplayDevice;
    webgpuObject!: GPUQueue;

    constructor(replay: Replay, desc: TraceQueue) {
        super(replay, desc);
        this.device = this.replay.devices[desc.deviceSerial];
        this.webgpuObject = this.device.webgpuObject.queue;
    }

    executeSubmit(commandBuffers) {
        const encoder = this.device.webgpuObject.createCommandEncoder();
        for (const commandBuffer of commandBuffers) {
            commandBuffer.encodeIn(encoder);
        }
        this.webgpuObject.submit([encoder.finish()]);
    }

    replaySubmitTo(path, commandBuffers) {
        const commandBufferIndex = path.shift();
        const encoder = this.device.webgpuObject.createCommandEncoder();
        for (let i = 0; i < commandBufferIndex - 1; i++) {
            commandBuffers[i].encodeIn(encoder);
        }
        commandBuffers[commandBufferIndex].encodeUpTo(path, encoder);
        this.webgpuObject.submit([encoder.finish()]);
    }
}

export interface ReplayGPUProgramableStage {
    moduleSerial: string;
    module: GPUShaderModule;
    entryPoint: string;
    constants?: Record<string, number>;
}

export interface ReplayGPUVertexState extends ReplayGPUProgramableStage {
    buffers?: Array<GPUVertexBufferLayout>;
}

export interface ReplayGPUFragmentState extends ReplayGPUProgramableStage {
    targets?: Array<GPUColorTargetState>;
}

export interface ReplayGPURenderPipelineDescriptor {
    vertex: ReplayGPUVertexState;
    primitive?: GPUPrimitiveState;
    depthStencil?: GPUDepthStencilState;
    multisample?: GPUMultisampleState;
    fragment?: ReplayGPUFragmentState;
}

export class ReplayRenderPipeline extends ReplayObject {
    device: ReplayDevice;
    desc: TraceRenderPipeline; // TODO: This needs to change to a different type
    webgpuObject!: GPURenderPipeline;

    constructor(replay: Replay, desc: TraceRenderPipeline) {
        super(replay, desc);
        this.device = this.replay.devices[desc.deviceSerial];
        this.desc = desc;
    }

    async recreate(desc: TraceRenderPipeline) {
        const vsModule = this.replay.shaderModules[desc.vertex.moduleSerial];
        this.desc.vertex.module = vsModule;

        // Do this properly and with all state pls.
        const localDesc: GPURenderPipelineDescriptor = {
            label: desc.label,
            vertex: {
                ...desc.vertex,
                module: vsModule.webgpuObject,
            },
            depthStencil: desc.depthStencil,
            multisample: desc.multisample,
            primitive: desc.primitive,
        };

        if (desc.fragment !== undefined) {
            const fsModule = this.replay.shaderModules[desc.fragment.moduleSerial];
            this.desc.fragment.module = fsModule;
            localDesc.fragment = {
                ...desc.fragment,
                module: fsModule.webgpuObject,
            };
        }

        if (desc.layout === 'auto') {
            localDesc.layout = 'auto';
        } else {
            const layout = this.replay.pipelineLayouts[desc.layoutSerial!];
            desc.layout = layout;
            localDesc.layout = layout.webgpuObject;
        }

        this.webgpuObject = await this.device.webgpuObject.createRenderPipelineAsync(localDesc);
    }
}

export class ReplaySampler extends ReplayObject {
    device: ReplayDevice;
    desc: TraceSampler;
    webgpuObject!: GPUSampler;

    constructor(replay: Replay, desc: TraceSampler) {
        super(replay, desc);
        this.desc = desc;
        this.device = this.replay.devices[desc.deviceSerial];
        this.webgpuObject = this.device.webgpuObject.createSampler(desc);
    }
}

export class ReplayShaderModule extends ReplayObject {
    device: ReplayDevice;
    desc: GPUShaderModuleDescriptor;
    webgpuObject!: GPUShaderModule;

    constructor(replay: Replay, desc: TraceShaderModule) {
        super(replay, desc);
        this.device = this.replay.devices[desc.deviceSerial];
        this.desc = desc;
        this.webgpuObject = this.device.webgpuObject?.createShaderModule({
            code: desc.code,
        });
    }
}

export class ReplayTexture extends ReplayObject {
    device: ReplayDevice;
    size: GPUExtent3DDictFull;
    format: GPUTextureFormat;
    sampleCount: number;
    mipLevelCount: number;
    dimension: GPUTextureDimension;
    webgpuObject: GPUTexture;
    swapChainId?: string;

    constructor(replay: Replay, desc: TraceTexture) {
        super(replay, desc);
        this.device = this.replay.devices[desc.deviceSerial];
        this.size = desc.size;
        this.format = desc.format;
        this.sampleCount = desc.sampleCount;
        this.mipLevelCount = desc.mipLevelCount;
        this.dimension = desc.dimension ?? '2d';
        this.swapChainId = desc.swapChainId;

        this.webgpuObject = this.device.webgpuObject.createTexture({
            format: this.format,
            usage: desc.usage | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING,
            size: this.size,
            dimension: desc.dimension,
            mipLevelCount: desc.mipLevelCount,
            sampleCount: desc.sampleCount,
            viewFormats: desc.viewFormats,
        });

        if (desc.initialData !== undefined) {
            this.loadInitialData(desc.initialData);
        } else if (desc.state === 'destroyed') {
            this.webgpuObject.destroy();
        }
    }

    loadInitialData(initialData: TraceTextureInitialData[]) {
        if (this.sampleCount !== 1) {
            console.warn('No support for sampleCount > 1 texture initial data.');
            return;
        }
        if (this.dimension !== '2d') {
            console.warn("No support for dimension != '2d' texture initial data.");
            return;
        }
        //if (kTextureFormatInfo[this.format].type !== 'color') {
        //    console.warn('No support for non-color texture initial data.');
        //    return result;
        //}

        for (const subResource of initialData) {
            const data = this.replay.getData(subResource.data);
            const mip = subResource.mipLevel;
            const width = Math.max(1, this.size.width >> mip);
            const height = Math.max(1, this.size.height >> mip);
            const depthOrArrayLayers = this.size.depthOrArrayLayers; // TODO support 3D.

            this.device.webgpuObject.queue.writeTexture(
                {
                    texture: this.webgpuObject,
                    mipLevel: mip,
                },
                data,
                { bytesPerRow: subResource.bytesPerRow, rowsPerImage: height },
                { width, height, depthOrArrayLayers }
            );
        }
    }

    get formatType(): string {
        return kTextureFormatInfo[this.format]?.type ?? '';
    }
}

export class ReplayTextureView extends ReplayObject {
    texture: ReplayTexture;
    desc: GPUTextureViewDescriptor;
    dimension: GPUTextureViewDimension;
    baseMipLevel: number;
    mipLevelCount: number;
    baseArrayLayer: number;
    arrayLayerCount: number;
    webgpuObject?: GPUTextureView;

    constructor(replay: Replay, desc: TraceTextureView) {
        super(replay, desc);
        this.desc = desc;
        this.texture = this.replay.textures[desc.textureSerial];

        this.dimension = desc.dimension;
        if (this.dimension === undefined) {
            switch (this.texture.dimension) {
                case '1d':
                    this.dimension = '1d';
                    break;
                case '2d':
                    this.dimension = this.texture.size.depthOrArrayLayers > 1 ? '2d-array' : '2d';
                    break;
                case '3d':
                    this.dimension = '3d';
                    break;
            }
        }

        this.baseMipLevel = desc.baseMipLevel ?? 0;
        this.mipLevelCount = desc.mipLevelCount ?? this.texture.mipLevelCount - this.baseMipLevel;
        this.baseArrayLayer = desc.baseArrayLayer ?? 0;
        if (this.desc.dimension === '2d-array') {
            this.arrayLayerCount = desc.arrayLayerCount ?? this.texture.size.depthOrArrayLayers - this.baseArrayLayer;
        } else {
            this.arrayLayerCount = desc.arrayLayerCount ?? 1;
        }

        this.webgpuObject = this.texture.webgpuObject.createView({
            format: desc.format,
            dimension: desc.dimension,
            aspect: desc.aspect,
            baseMipLevel: desc.baseMipLevel,
            mipLevelCount: desc.mipLevelCount,
            baseArrayLayer: desc.baseArrayLayer,
            arrayLayerCount: desc.arrayLayerCount,
        });
    }
}
