<script lang="ts">
	let { content = 'Heading' }: { content?: string } = $props();
</script>

<h3 class="text-ink font-serif text-xl lg:text-[20px]">{content}</h3>
