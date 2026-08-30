<script>
	import { page } from '$app/state';
</script>

<div class="grid h-full w-full place-items-center">
	<div class="flex max-w-[48ch] flex-col items-start gap-4 border-l-2 border-fx-accent pl-6">
		<span class="label text-[10px] text-fx-accent">Error {page.status}</span>
		<h1 class="m-0 font-serif text-[62px] font-semibold leading-none tracking-[-0.02em] text-ink">
			{page.status}
		</h1>
		<p class="m-0 text-[18px] leading-relaxed text-body">{page.error?.message}</p>
	</div>
</div>
