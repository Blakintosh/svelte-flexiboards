<script module lang="ts">
	type DashboardRegistryItem = {
		component: Component;
		componentProps: Record<string, unknown>;
	};
</script>

<script lang="ts">
	import { FlexiBoard, FlexiTarget, FlexiWidget, simpleTransitionConfig } from 'svelte-flexiboards';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
    import { AspectRatio } from "$lib/components/ui/aspect-ratio";
    
	import AppSidebar from '$lib/components/examples/flexiboard/app-sidebar.svelte';
	import type { FlexiBoardConfiguration, FlexiBoardController } from 'svelte-flexiboards';
	import DashboardTile from '$lib/components/examples/flexiboard/dashboard-tile.svelte';
	import type { Component } from 'svelte';
	import BrightnessSlider from '$lib/components/examples/flexspressive/brightness-slider.svelte';
	import Tile from '$lib/components/examples/flexspressive/tile.svelte';
	import Wifi from 'lucide-svelte/icons/wifi';
	import Bluetooth from 'lucide-svelte/icons/bluetooth';
	import Pencil from 'lucide-svelte/icons/pencil';
	import { BluetoothOff, CircleOff, Flashlight, FlashlightOff, Moon, MoonStar, Navigation, NavigationOff, Plane, PlaneLanding, RefreshCw, RefreshCwOff, Share, Wallet, WifiOff } from 'lucide-svelte';

	let editMode = $state(true);

	let boardConfig: FlexiBoardConfiguration = $state({
		widgetDefaults: {
			draggable: false,
			resizability: 'horizontal'
		}
	});

	let onBoardReady = (board: FlexiBoardController) => {};
</script>

<svelte:head>
	<title>Flexiboards</title>
</svelte:head>

<div class="flex flex-col items-stretch mx-auto aspect-[9/18] gap-0.5 h-full py-8 border rounded-4xl px-6 text-sm">
    <div class="flex justify-between items-center">
        <h1 class="font-semibold text-3xl">
            9:30
        </h1>
    </div>
    <div class="flex justify-between items-center text-muted-foreground">
        <h3>
            Tue, Jul 19
        </h3>
        <h3>
            Until 10:00 AM
        </h3>
    </div>
    <BrightnessSlider />

    <FlexiBoard config={boardConfig}>
        <FlexiTarget config={{
            layout: {
                type: 'free',
                minColumns: 4,
                maxColumns: 4,
                minRows: 4,
                maxRows: 4
            },
            rowSizing: 'minmax(0, 1fr)'
        }} class="gap-2">
            <Tile title="Internet" on x={0} y={0} width={2} height={1} onIcon={Wifi} offIcon={WifiOff}/>
            <Tile title="Bluetooth" on={false} x={2} y={0} width={2} height={1} onIcon={Bluetooth} offIcon={BluetoothOff}/>
            <Tile title="Flashlight" on={true} x={0} y={1} width={1} height={1} onIcon={Flashlight} offIcon={FlashlightOff}/>
            <Tile title="Modes" on={false} x={1} y={1} width={1} height={1} onIcon={CircleOff} offIcon={CircleOff}/>
            <Tile title="Sharedrop" on={false} x={2} y={1} width={2} height={1} onIcon={Share} offIcon={Share}/>
            <Tile title="Airplane Mode" on={false} x={0} y={2} width={2} height={1} onIcon={Plane} offIcon={PlaneLanding}/>
            <Tile title="Auto-Rotate" on={true} x={2} y={2} width={2} height={1} onIcon={RefreshCw} offIcon={RefreshCwOff}/>
            <Tile title="Wallet" on={true} x={0} y={3} width={2} height={1} onIcon={Wallet} offIcon={Wallet}/>
            <Tile title="Location" on={true} x={2} y={3} width={1} height={1} onIcon={Navigation} offIcon={NavigationOff}/>
            <Tile title="Night Light" on={false} x={3} y={3} width={1} height={1} onIcon={MoonStar} offIcon={Moon}/>
        </FlexiTarget>
    </FlexiBoard>
    <div class="flex justify-between items-center text-muted-foreground my-2">
        <p class="w-16">
            16
        </p>
        <div class="flex items-center gap-1">
            <div class="h-2 w-4 rounded-lg bg-primary">

            </div>
            <div class="size-2 rounded-lg bg-muted"></div>
        </div>
        <h3 class="w-16 flex justify-end">
            <Pencil class="size-5" />
        </h3>
    </div>
</div>