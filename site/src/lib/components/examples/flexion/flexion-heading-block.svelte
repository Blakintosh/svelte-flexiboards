<script lang="ts">
	let { content = 'Heading' }: { content?: string } = $props();
</script>

<h3 class="font-serif text-xl text-ink lg:text-[20px]">{content}</h3>
