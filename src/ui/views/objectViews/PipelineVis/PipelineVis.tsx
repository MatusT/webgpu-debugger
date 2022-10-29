import React from 'react';
import { ReplayRenderPipeline } from '../../../../replay';
import { ValueObject } from '../../../components/Value/Value';

export default function PipelineVis({ data }: { data: ReplayRenderPipeline }) {
    return (
        <div className="spector2-viz">
            <ValueObject data={data} />
        </div>
    );
}
