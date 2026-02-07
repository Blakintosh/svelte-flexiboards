<script>
	import { page } from '$app/state';
</script>

<div class="grid h-full w-full place-items-center">
	<div class="flex flex-col items-center gap-8">
		<h1 class="font-display text-8xl font-medium">{page.status}</h1>
		<p class="text-xl">{page.error?.message}</p>
	</div>
</div>
