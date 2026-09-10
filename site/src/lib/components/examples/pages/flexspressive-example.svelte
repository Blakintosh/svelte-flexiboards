<script lang="ts">
	import { FlexiBoard, FlexiTarget, cssTransitionConfig } from '@flexiboards/svelte';
	import Button from '$lib/components/examples/common/button.svelte';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';

	import type { FlexiBoardConfiguration } from '@flexiboards/svelte';
	import BrightnessSlider from '$lib/components/examples/flexspressive/brightness-slider.svelte';
	import Tile from '$lib/components/examples/flexspressive/tile.svelte';
	import Wifi from 'lucide-svelte/icons/wifi';
	import Bluetooth from 'lucide-svelte/icons/bluetooth';
	import Pencil from 'lucide-svelte/icons/pencil';
	import {
		BluetoothOff,
		CircleOff,
		Flashlight,
		FlashlightOff,
		Moon,
		MoonStar,
		Navigation,
		NavigationOff,
		Plane,
		PlaneLanding,
		RefreshCw,
		RefreshCwOff,
		Share,
		Wallet,
		WifiOff
	} from 'lucide-svelte';
	import { createFlexspressiveEditor } from '$lib/components/examples/flexspressive/index.svelte';

	const editor = createFlexspressiveEditor();

	let editMode = $derived(editor.editMode);

	// Snap, don't float: the CSS defaults, with the resize snap pulled to 160ms
	// so a tile widening under the nub lands as fast as the fill it sits beside.
	const boardConfig: FlexiBoardConfiguration = {
		widgetDefaults: {
			draggability: 'none',
			resizability: 'none',
			transition: {
				...cssTransitionConfig(),
				resize: { duration: 160, easing: 'ease-out' }
			}
		}
	};
</script>

<!--
	The handset is a lifted card resting on the recessed stage, flanked by margin
	annotations that explain the two states it can be in. The flanks are dropped
	below lg, where there is no room for them beside a 308px handset.
-->
<div class="bg-stage flex h-full w-full items-center justify-center gap-9 overflow-hidden p-4">
	<div class="hidden w-[170px] shrink-0 flex-col gap-6 text-right lg:flex">
		<div>
			<div class="text-faint mb-1.5 text-[11.5px] font-semibold">Free grid · 4 × 4</div>
			<p class="text-body text-xs leading-relaxed">
				Tiles pack horizontally; a resize pushes neighbours aside.
			</p>
		</div>
		<div>
			<div class="text-faint mb-1.5 flex items-center justify-end gap-1.5 text-[11.5px] font-semibold">
				Editing tile
				<span class="bg-fx-accent size-1.5 shrink-0 rounded-full"></span>
			</div>
			<p class="text-body text-xs leading-relaxed">
				Tap in edit mode: dashed frame, fx-accent resize nub, drag free.
			</p>
		</div>
	</div>

	<!-- A lifted card standing in for the handset: soft bezel, no ink rule. -->
	<div
		class="border-rule-soft bg-panel shadow-card-lg flex h-full max-h-[616px] w-full max-w-[308px] shrink-0 flex-col gap-2 rounded-[32px] border px-[18px] pt-5 pb-3 text-sm"
	>
		{#if !editMode}
			<div class="flex items-center justify-between">
				<h1 class="text-ink font-mono text-3xl leading-none">9:30</h1>
			</div>
			<div class="flex items-center justify-between">
				<span class="text-faint text-[10px] font-semibold">Tue, 19 Jul</span>
				<span class="text-faint text-[10px] font-semibold">Until 10:00</span>
			</div>
			<BrightnessSlider />
		{:else}
			<div class="mb-4 flex items-center gap-4">
				<Button
					size={'icon'}
					variant={'outline'}
					class={'cursor-pointer rounded-full'}
					onclick={() => (editor.editMode = false)}
				>
					<ArrowLeft class="size-5" />
					<span class="sr-only">Go back</span>
				</Button>
				<h1 class="text-ink font-serif text-[19px]">Edit tiles</h1>
			</div>
			<p class="text-body mb-4 text-center text-[13px]">Select tiles to rearrange and resize</p>
		{/if}

		<!-- Uniform 46px rhythm: rows are fixed, so a tile is the same height wherever it lands. -->
		<FlexiBoard config={boardConfig}>
			<FlexiTarget
				config={{
					layout: {
						type: 'free',
						minColumns: 4,
						maxColumns: 4,
						minRows: 4,
						maxRows: 4,
						packing: 'horizontal'
					},
					rowSizing: '46px'
				}}
				class="gap-[7px]"
			>
				<Tile title="Internet" on x={0} y={0} width={2} height={1} onIcon={Wifi} offIcon={WifiOff} />
				<Tile
					title="Bluetooth"
					on={false}
					x={2}
					y={0}
					width={2}
					height={1}
					onIcon={Bluetooth}
					offIcon={BluetoothOff}
				/>
				<Tile
					title="Flashlight"
					on={true}
					x={0}
					y={1}
					width={1}
					height={1}
					onIcon={Flashlight}
					offIcon={FlashlightOff}
				/>
				<Tile
					title="Modes"
					on={false}
					x={1}
					y={1}
					width={1}
					height={1}
					onIcon={CircleOff}
					offIcon={CircleOff}
				/>
				<Tile
					title="Sharedrop"
					on={false}
					x={2}
					y={1}
					width={2}
					height={1}
					onIcon={Share}
					offIcon={Share}
				/>
				<Tile
					title="Airplane Mode"
					on={false}
					x={0}
					y={2}
					width={2}
					height={1}
					onIcon={Plane}
					offIcon={PlaneLanding}
				/>
				<Tile
					title="Auto-Rotate"
					on={true}
					x={2}
					y={2}
					width={2}
					height={1}
					onIcon={RefreshCw}
					offIcon={RefreshCwOff}
				/>
				<Tile
					title="Wallet"
					on={true}
					x={0}
					y={3}
					width={2}
					height={1}
					onIcon={Wallet}
					offIcon={Wallet}
				/>
				<Tile
					title="Location"
					on={true}
					x={2}
					y={3}
					width={1}
					height={1}
					onIcon={Navigation}
					offIcon={NavigationOff}
				/>
				<Tile
					title="Night Light"
					on={false}
					x={3}
					y={3}
					width={1}
					height={1}
					onIcon={MoonStar}
					offIcon={Moon}
				/>
			</FlexiTarget>
		</FlexiBoard>
		{#if !editMode}
			<div class="my-2 flex items-center justify-between">
				<p class="text-faint w-16 font-mono text-[10px]">16</p>
				<div class="flex items-center gap-1">
					<div class="bg-ink h-2 w-4 rounded-full"></div>
					<div class="bg-rule-faint size-2 rounded-full"></div>
				</div>
				<div class="flex w-16 justify-end">
					<Button
						size={'icon'}
						variant={'ghost'}
						class={'cursor-pointer rounded-full'}
						onclick={() => (editor.editMode = true)}
					>
						<Pencil class="size-5" />
						<span class="sr-only">Edit tiles</span>
					</Button>
				</div>
			</div>
		{/if}
		<div class="flex grow flex-col items-center justify-end">
			<div class="bg-ink h-1 w-[110px] rounded-full"></div>
		</div>
	</div>

	<div class="hidden w-[170px] shrink-0 flex-col gap-6 lg:flex">
		<div>
			<div class="text-faint mb-1.5 text-[11.5px] font-semibold">On = ink fill</div>
			<p class="text-body text-xs leading-relaxed">
				State is a fill, never a colour swap; off tiles sit in the tint.
			</p>
		</div>
		<div>
			<div class="text-faint mb-1.5 text-[11.5px] font-semibold">Brightness</div>
			<p class="text-body text-xs leading-relaxed">
				A gauge: ink in a ruled trough, fx-accent thumb.
			</p>
		</div>
	</div>
</div>
