<script>
	import { page } from '$app/state';
</script>

<div class="grid h-full w-full place-items-center">
	<div class="border-fx-accent flex max-w-[48ch] flex-col items-start gap-4 border-l-2 pl-6">
		<span class="label text-fx-accent text-[10px]">Error {page.status}</span>
		<h1 class="text-ink m-0 font-serif text-[62px] font-semibold leading-none tracking-[-0.02em]">
			{page.status}
		</h1>
		<p class="text-body m-0 text-[18px] leading-relaxed">{page.error?.message}</p>
	</div>
</div>
